import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Types ──────────────────────────────────────────────────────────────────────

interface WebhookPayload {
  type: 'INSERT';
  table: string;
  schema: string;
  record: NotificationRecord;
  old_record: null;
}

interface NotificationRecord {
  id: string;
  user_id: string;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  delivery_state: string;
  expires_at: string | null;
  idempotency_key: string | null;
}

interface PushToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default';
  badge?: number;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function isExpoToken(token: string): boolean {
  return (
    token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')
  );
}

async function sendExpoPush(
  messages: ExpoPushMessage[],
  accessToken?: string
): Promise<ExpoPushTicket[]> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Accept-Encoding': 'gzip, deflate',
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers,
    body: JSON.stringify(messages),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Expo API ${res.status}: ${text}`);
  }

  const json = await res.json();
  return (json.data ?? []) as ExpoPushTicket[];
}

// ── Main ───────────────────────────────────────────────────────────────────────

Deno.serve(async req => {
  // Supabase webhooks send POST; ignore everything else
  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response('invalid json', { status: 400 });
  }

  // Only handle INSERT events on the notifications table
  if (payload.type !== 'INSERT' || payload.table !== 'notifications') {
    return new Response('ignored', { status: 200 });
  }

  const notification = payload.record;

  // Skip if already delivered or explicitly failed
  if (notification.delivery_state === 'delivered') {
    return new Response('already delivered', { status: 200 });
  }

  // Skip if expired
  if (
    notification.expires_at &&
    new Date(notification.expires_at) < new Date()
  ) {
    return new Response('expired', { status: 200 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const expoAccessToken = Deno.env.get('EXPO_ACCESS_TOKEN'); // optional

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── Idempotency guard: re-read from DB to catch concurrent webhook replays ─
  const { data: freshNotif } = await admin
    .from('notifications')
    .select('delivery_state')
    .eq('id', notification.id)
    .single();

  if (freshNotif?.delivery_state === 'delivered') {
    console.log(
      `[send-push] notification ${notification.id} already delivered, skipping replay`
    );
    return new Response('already delivered', { status: 200 });
  }

  // ── 1. Fetch active push tokens for this user ────────────────────────────
  const { data: tokens, error: tokensError } = await admin
    .from('push_tokens')
    .select('token, platform')
    .eq('user_id', notification.user_id)
    .eq('is_active', true);

  if (tokensError) {
    console.error('[send-push] fetch tokens error:', tokensError.message);
    await markFailed(admin, notification.id);
    return new Response('token fetch error', { status: 500 });
  }

  const validTokens = (tokens as PushToken[]).filter(t => isExpoToken(t.token));

  if (validTokens.length === 0) {
    console.log(`[send-push] no valid tokens for user ${notification.user_id}`);
    // Not an error — user simply has no registered device
    return new Response('no tokens', { status: 200 });
  }

  // ── 2. Build Expo push messages ──────────────────────────────────────────
  const messages: ExpoPushMessage[] = validTokens.map(t => ({
    to: t.token,
    title: notification.title,
    body: notification.body,
    data: { notification_id: notification.id, ...notification.metadata },
    sound: 'default',
    channelId: t.platform === 'android' ? 'default' : undefined,
    priority: 'high',
  }));

  // ── 3. Send in batches of 100 (Expo limit) ───────────────────────────────
  const BATCH_SIZE = 100;
  const allTickets: ExpoPushTicket[] = [];
  let sendError: string | null = null;

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);
    try {
      const tickets = await sendExpoPush(batch, expoAccessToken);
      allTickets.push(...tickets);
    } catch (err) {
      console.error('[send-push] expo send error:', err);
      sendError = String(err);
      break;
    }
  }

  // ── 4. Count successes and clean up invalid tokens ───────────────────────
  const successCount = allTickets.filter(t => t.status === 'ok').length;
  const invalidTokens: string[] = [];

  allTickets.forEach((ticket, i) => {
    if (
      ticket.status === 'error' &&
      ticket.details?.error === 'DeviceNotRegistered'
    ) {
      invalidTokens.push(validTokens[i]?.token ?? '');
    }
  });

  // Deactivate invalid tokens in background (don't await to keep response fast)
  if (invalidTokens.length > 0) {
    admin
      .from('push_tokens')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .in('token', invalidTokens)
      .then(({ error }) => {
        if (error)
          console.error('[send-push] deactivate tokens error:', error.message);
      });
  }

  // ── 5. Update delivery_state on the notification ─────────────────────────
  const finalState =
    sendError != null ? 'failed' : successCount > 0 ? 'delivered' : 'failed';

  await admin
    .from('notifications')
    .update({
      delivery_state: finalState,
      push_sent_at:
        finalState === 'delivered' ? new Date().toISOString() : null,
    })
    .eq('id', notification.id);

  console.log(
    `[send-push] notification ${notification.id} → ${finalState} (${successCount}/${validTokens.length} tokens)`
  );

  return new Response(
    JSON.stringify({
      state: finalState,
      sent: successCount,
      total: validTokens.length,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});

// ── Helpers ────────────────────────────────────────────────────────────────────

async function markFailed(
  admin: ReturnType<typeof createClient>,
  notificationId: string
) {
  await admin
    .from('notifications')
    .update({ delivery_state: 'failed' })
    .eq('id', notificationId);
}
