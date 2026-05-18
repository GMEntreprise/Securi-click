import { supabase } from '@/lib/supabase/client';
import type {
  CollectorGuardian,
  CollectorIdentity,
  CollectorPickupLog,
  DocumentType,
} from '../types';

export interface CollectorQrCode {
  id: string;
  child_id: string;
  guardian_id: string | null;
  token: string;
  expires_at: string;
  is_used: boolean;
  created_at: string;
  child?: { first_name: string; last_name: string; photo_url: string | null } | null;
}

export interface CollectorRecentScan {
  id: string;
  child_id: string;
  guardian_id: string | null;
  pickup_time: string;
  status: 'completed' | 'denied' | 'cancelled';
  denial_reason: string | null;
  child?: { first_name: string; last_name: string } | null;
  guardian?: { first_name: string; last_name: string; relationship: string } | null;
}

const GUARDIAN_SELECT = `
  id, parent_id, child_id, first_name, last_name, phone, email,
  relationship, photo_url, priority, is_active, identity_status,
  identity_verified, collector_user_id, created_at, updated_at,
  child:children ( id, first_name, last_name, photo_url, class_name, medical_notes,
    school:schools ( id, name, city )
  )
`.trim();

const PENDING_INVITE_SELECT = `
  id, invitation_token, access_code_hash, first_name, last_name,
  relationship, parent_id,
  child:children ( id, first_name, last_name, photo_url )
`.trim();

export interface PendingInvite {
  id: string;
  invitation_token: string;
  access_code_hash: string | null;
  first_name: string;
  last_name: string;
  relationship: string;
  parent_id: string;
  child: {
    id: string;
    first_name: string;
    last_name: string;
    photo_url: string | null;
  } | null;
}

const IDENTITY_SELECT = `
  id, collector_user_id, parent_id, document_type, front_path, back_path,
  selfie_path, verification_status, verified_at, verified_by,
  refusal_reason, created_at, updated_at
`.trim();

const LOG_SELECT = `
  id, child_id, guardian_id, pickup_time, status, denial_reason,
  child:children ( first_name, last_name, photo_url )
`.trim();

export const collectorService = {
  async getMyGuardians(collectorUserId: string): Promise<CollectorGuardian[]> {
    const { data, error } = await supabase
      .from('guardians')
      .select(GUARDIAN_SELECT)
      .eq('collector_user_id', collectorUserId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as CollectorGuardian[];
  },

  async getMyIdentity(
    collectorUserId: string
  ): Promise<CollectorIdentity | null> {
    const { data, error } = await supabase
      .from('collector_identities')
      .select(IDENTITY_SELECT)
      .eq('collector_user_id', collectorUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as unknown as CollectorIdentity | null;
  },

  async getMyPickupLogs(
    collectorUserId: string,
    limit = 20
  ): Promise<CollectorPickupLog[]> {
    const guardianRows = await supabase
      .from('guardians')
      .select('id')
      .eq('collector_user_id', collectorUserId);
    if (guardianRows.error) throw guardianRows.error;
    const guardianIds = (guardianRows.data ?? []).map(g => g.id);
    if (guardianIds.length === 0) return [];

    const { data, error } = await supabase
      .from('pickup_logs')
      .select(LOG_SELECT)
      .in('guardian_id', guardianIds)
      .order('pickup_time', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as unknown as CollectorPickupLog[];
  },

  async upsertIdentity(
    collectorUserId: string,
    parentId: string,
    documentType: DocumentType,
    frontPath: string | null,
    backPath: string | null,
    selfiePath: string | null
  ): Promise<CollectorIdentity> {
    const { data, error } = await supabase
      .from('collector_identities')
      .upsert(
        {
          collector_user_id: collectorUserId,
          parent_id: parentId,
          document_type: documentType,
          front_path: frontPath,
          back_path: backPath,
          selfie_path: selfiePath,
          verification_status: 'pending',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'collector_user_id,parent_id' }
      )
      .select(IDENTITY_SELECT)
      .single();
    if (error) throw error;
    return data as unknown as CollectorIdentity;
  },

  async uploadIdentityDocument(
    collectorUserId: string,
    parentId: string,
    slot: 'front' | 'back' | 'selfie',
    uri: string
  ): Promise<string> {
    const ext = uri.split('.').pop() ?? 'jpg';
    const path = `${parentId}/${collectorUserId}/${slot}-${Date.now()}.${ext}`;

    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();

    const { error } = await supabase.storage
      .from('identity-documents')
      .upload(path, arrayBuffer, { contentType: `image/${ext}`, upsert: true });
    if (error) throw error;
    return path;
  },

  async getSignedIdentityUrl(path: string, expiresIn = 300): Promise<string> {
    const { data, error } = await supabase.storage
      .from('identity-documents')
      .createSignedUrl(path, expiresIn);
    if (error) throw error;
    return data.signedUrl;
  },

  async getPendingInvitesByEmail(email: string): Promise<PendingInvite[]> {
    const { data, error } = await supabase.rpc('get_pending_invites_by_email', {
      p_email: email,
    });
    if (error) throw error;
    return (data ?? []) as PendingInvite[];
  },

  async acceptInvite(
    invitationToken: string,
    accessCode: string | null
  ): Promise<{ guardian_id: string; parent_id: string }> {
    const { data, error } = await supabase.rpc('accept_guardian_invite', {
      p_invitation_token: invitationToken,
      p_access_code: accessCode,
    });
    if (error) throw error;
    if ((data as { error?: string }).error) {
      throw new Error((data as { error: string }).error);
    }
    return data as { guardian_id: string; parent_id: string };
  },

  async getCollectorProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, phone, avatar_url, role, created_at')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  async updateCollectorProfile(
    userId: string,
    payload: { first_name: string; last_name: string; phone: string }
  ) {
    const { error } = await supabase
      .from('user_profiles')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) throw error;
  },

  async uploadAvatar(userId: string, uri: string): Promise<string> {
    const ext = uri.split('.').pop() ?? 'jpg';
    const path = `${userId}/avatar.${ext}`;
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();
    const { error } = await supabase.storage
      .from('collector-avatars')
      .upload(path, arrayBuffer, { contentType: `image/${ext}`, upsert: true });
    if (error) throw error;
    const { data } = supabase.storage
      .from('collector-avatars')
      .getPublicUrl(path);
    await supabase
      .from('user_profiles')
      .update({ avatar_url: data.publicUrl })
      .eq('user_id', userId);
    return data.publicUrl;
  },

  async updateAvatarUrl(userId: string, avatarUrl: string): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) throw error;
  },

  // ── QR code — collector generates for their own child access ─────────────

  async getCollectorQrCode(
    collectorUserId: string,
    childId?: string
  ): Promise<CollectorQrCode | null> {
    // Get guardian IDs for this collector
    const { data: guardians, error: gErr } = await supabase
      .from('guardians')
      .select('id, child_id')
      .eq('collector_user_id', collectorUserId)
      .eq('is_active', true);
    if (gErr) throw gErr;
    if (!guardians || guardians.length === 0) return null;

    const guardianIds = guardians.map(g => g.id);
    const targetChildId = childId ?? guardians[0]?.child_id;
    if (!targetChildId) return null;

    const { data, error } = await supabase
      .from('qr_codes')
      .select('id, child_id, guardian_id, token, expires_at, is_used, created_at, child:children(first_name, last_name, photo_url)')
      .in('guardian_id', guardianIds)
      .eq('child_id', targetChildId)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as unknown as CollectorQrCode | null;
  },

  async getCollectorRecentScans(
    collectorUserId: string,
    childId?: string,
    limit = 5
  ): Promise<CollectorRecentScan[]> {
    const { data: guardians, error: gErr } = await supabase
      .from('guardians')
      .select('id, child_id')
      .eq('collector_user_id', collectorUserId);
    if (gErr) throw gErr;
    if (!guardians || guardians.length === 0) return [];

    const guardianIds = guardians.map(g => g.id);

    let q = supabase
      .from('pickup_logs')
      .select('id, child_id, guardian_id, pickup_time, status, denial_reason, child:children(first_name, last_name), guardian:guardians(first_name, last_name, relationship)')
      .in('guardian_id', guardianIds)
      .order('pickup_time', { ascending: false })
      .limit(limit);

    if (childId) q = q.eq('child_id', childId);

    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as unknown as CollectorRecentScan[];
  },

  async generateCollectorQrCode(
    collectorUserId: string,
    childId: string,
    guardianId: string
  ): Promise<CollectorQrCode> {
    // Find the parent_id via the guardian record to call the RPC correctly
    const { data: guardian, error: gErr } = await supabase
      .from('guardians')
      .select('parent_id')
      .eq('id', guardianId)
      .eq('collector_user_id', collectorUserId)
      .single();
    if (gErr) throw gErr;

    const { data, error } = await supabase.rpc('generate_qr_code', {
      p_parent_id: guardian.parent_id,
      p_child_id: childId,
      p_guardian_id: guardianId,
      p_expires_in_hours: 24,
    });
    if (error) throw error;

    const qrId = data as string;
    const { data: qr, error: fetchErr } = await supabase
      .from('qr_codes')
      .select('id, child_id, guardian_id, token, expires_at, is_used, created_at, child:children(first_name, last_name, photo_url)')
      .eq('id', qrId)
      .single();
    if (fetchErr) throw fetchErr;
    return qr as unknown as CollectorQrCode;
  },
};
