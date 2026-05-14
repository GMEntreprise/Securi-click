import { supabase } from '@/lib/supabase/client';

export interface QrCode {
  id: string;
  parent_id: string;
  child_id: string;
  guardian_id: string | null;
  token: string;
  expires_at: string;
  is_used: boolean;
  used_at: string | null;
  created_at: string;
  child?: {
    first_name: string;
    last_name: string;
    photo_url: string | null;
  };
}

export interface RecentScan {
  id: string;
  child_id: string;
  guardian_id: string | null;
  pickup_time: string;
  status: 'completed' | 'denied' | 'cancelled';
  denial_reason: string | null;
  child?: { first_name: string; last_name: string } | null;
  guardian?: {
    first_name: string;
    last_name: string;
    relationship: string;
  } | null;
}

const QR_SELECT = `
  id, parent_id, child_id, guardian_id, token, expires_at, is_used, used_at, created_at,
  child:children ( first_name, last_name, photo_url )
`.trim();

const SCAN_SELECT = `
  id, child_id, guardian_id, pickup_time, status, denial_reason,
  child:children ( first_name, last_name ),
  guardian:guardians ( first_name, last_name, relationship )
`.trim();

export const qrService = {
  async getActiveQrCodes(parentId: string): Promise<QrCode[]> {
    const { data, error } = await supabase
      .from('qr_codes')
      .select(QR_SELECT)
      .eq('parent_id', parentId)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as QrCode[];
  },

  async getQrCodesForChild(
    parentId: string,
    childId: string
  ): Promise<QrCode[]> {
    const { data, error } = await supabase
      .from('qr_codes')
      .select(QR_SELECT)
      .eq('parent_id', parentId)
      .eq('child_id', childId)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) throw error;
    return (data ?? []) as unknown as QrCode[];
  },

  async generateQrCode(
    parentId: string,
    childId: string,
    guardianId: string | null,
    expiresInHours = 24
  ): Promise<QrCode> {
    const { data, error } = await supabase.rpc('generate_qr_code', {
      p_parent_id: parentId,
      p_child_id: childId,
      p_guardian_id: guardianId,
      p_expires_in_hours: expiresInHours,
    });
    if (error) throw error;
    const qrId = data as string;

    const { data: qr, error: fetchErr } = await supabase
      .from('qr_codes')
      .select(QR_SELECT)
      .eq('id', qrId)
      .single();
    if (fetchErr) throw fetchErr;
    return qr as unknown as QrCode;
  },

  async getRecentScans(
    parentId: string,
    childId?: string,
    limit = 5
  ): Promise<RecentScan[]> {
    if (childId) {
      const { data, error } = await supabase
        .from('pickup_logs')
        .select(SCAN_SELECT)
        .eq('child_id', childId)
        .order('pickup_time', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as RecentScan[];
    }

    const { data: childRows, error: childErr } = await supabase
      .from('children')
      .select('id')
      .eq('parent_id', parentId);
    if (childErr) throw childErr;

    const childIds = (childRows ?? []).map(c => c.id);
    if (childIds.length === 0) return [];

    const { data, error } = await supabase
      .from('pickup_logs')
      .select(SCAN_SELECT)
      .in('child_id', childIds)
      .order('pickup_time', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as unknown as RecentScan[];
  },
};
