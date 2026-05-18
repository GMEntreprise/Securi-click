import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders });

  try {
    const { email, pin } = await req.json();
    if (!email || !pin) return json({ error: 'missing_fields' }, 400);

    const normalizedEmail = String(email).trim().toLowerCase();

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ── 1. Find active guardian by email ──────────────────────────────────
    const { data: guardian, error: guardianError } = await admin
      .from('guardians')
      .select(
        'id, first_name, last_name, access_code_hash, access_code_version, pin_failed_attempts, pin_locked_until, child_id'
      )
      .eq('email', normalizedEmail)
      .eq('is_active', true)
      .not('access_code_hash', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (guardianError) {
      console.error(
        '[collector-login] guardian lookup:',
        guardianError.message
      );
      return json({ error: 'server_error' });
    }
    if (!guardian) return json({ error: 'no_active_guardian' });

    // ── 2. Lockout check ───────────────────────────────────────────────────
    if (
      guardian.pin_locked_until &&
      new Date(guardian.pin_locked_until) > new Date()
    ) {
      return json({ error: 'pin_locked' });
    }

    // ── 3. Verify PIN via bcrypt RPC ───────────────────────────────────────
    const { data: pinValid, error: pinError } = await admin.rpc(
      'verify_pin_bcrypt',
      {
        p_pin: String(pin),
        p_hash: guardian.access_code_hash,
      }
    );

    if (pinError) {
      console.error('[collector-login] verify_pin_bcrypt:', pinError.message);
      return json({ error: 'server_error' });
    }

    if (!pinValid) {
      const newAttempts = (guardian.pin_failed_attempts ?? 0) + 1;
      await admin
        .from('guardians')
        .update({
          pin_failed_attempts: newAttempts,
          pin_locked_until:
            newAttempts >= 5
              ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
              : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', guardian.id);
      return json({ error: 'invalid_pin' });
    }

    // ── 4. Reset failed attempts ───────────────────────────────────────────
    await admin
      .from('guardians')
      .update({
        pin_failed_attempts: 0,
        pin_locked_until: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', guardian.id);

    // ── 5. Get or create auth user — search by email directly ─────────────
    let userId: string;

    // Use listUsers with a search filter (avoids pagination issue)
    const { data: usersPage, error: listError } =
      await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    const existing = usersPage?.users?.find(
      u => u.email?.toLowerCase() === normalizedEmail
    );

    if (existing) {
      userId = existing.id;
      console.log('[collector-login] existing user:', userId);
    } else {
      const { data: created, error: createError } =
        await admin.auth.admin.createUser({
          email: normalizedEmail,
          email_confirm: true,
          user_metadata: {
            first_name: guardian.first_name,
            last_name: guardian.last_name,
            role: 'collector',
          },
        });
      if (createError || !created?.user) {
        console.error('[collector-login] createUser:', createError?.message);
        return json({ error: 'server_error' });
      }
      userId = created.user.id;
      console.log('[collector-login] created user:', userId);
    }

    // ── 6. Upsert user_profiles ────────────────────────────────────────────
    await admin.from('user_profiles').upsert(
      {
        user_id: userId,
        first_name: guardian.first_name,
        last_name: guardian.last_name,
        role: 'collector',
      },
      { onConflict: 'user_id', ignoreDuplicates: true }
    );

    // ── 7. Link collector_user_id if not yet set ───────────────────────────
    await admin
      .from('guardians')
      .update({
        collector_user_id: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', guardian.id)
      .is('collector_user_id', null);

    // ── 8. Generate session via generateLink (works on all Supabase plans) ─
    // We use generateLink to get a magic link, then exchange it for a session.
    // This is more reliable than createSession which requires newer SDK versions.
    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: 'magiclink',
        email: normalizedEmail,
        options: { redirectTo: 'securiclick://auth/callback' },
      });

    if (linkError || !linkData?.properties) {
      console.error('[collector-login] generateLink:', linkError?.message);
      return json({ error: 'server_error' });
    }

    // Exchange the hashed_token for a real session
    const hashed_token = linkData.properties.hashed_token;
    const { data: sessionData, error: sessionError } =
      await admin.auth.verifyOtp({
        token_hash: hashed_token,
        type: 'magiclink',
      });

    if (sessionError || !sessionData?.session) {
      console.error('[collector-login] verifyOtp:', sessionError?.message);
      return json({ error: 'server_error' });
    }

    // ── 9. Child name for greeting ─────────────────────────────────────────
    const { data: child } = await admin
      .from('children')
      .select('first_name')
      .eq('id', guardian.child_id)
      .maybeSingle();

    console.log('[collector-login] success for', normalizedEmail);

    return json({
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      expires_at: sessionData.session.expires_at,
      user: {
        id: userId,
        email: normalizedEmail,
        role: 'collector',
        first_name: guardian.first_name,
        last_name: guardian.last_name,
      },
      guardian_id: guardian.id,
      access_code_version: guardian.access_code_version,
      child_first_name: child?.first_name ?? '',
    });
  } catch (err) {
    console.error('[collector-login] unexpected:', err);
    return json({ error: 'server_error' }, 500);
  }
});
