import { supabase } from '@/lib/supabase/client';
import type {
  SchoolProfile,
  SchoolChild,
  PickupValidation,
  QrScanResult,
  UpdateSchoolPayload,
  DashboardStats,
} from '../types';

const SCHOOL_SELECT =
  'id, name, type, email, phone, address, city, postal_code, manager_first_name, manager_last_name, manager_function, admin_user_id, logo_url, opening_hours, slug, is_active, verified, external_id, created_at, updated_at';

const CHILD_SELECT =
  'id, parent_id, school_id, first_name, last_name, date_of_birth, photo_url, class_name, medical_notes, is_active, created_at, updated_at, parent:user_profiles!children_parent_id_user_profiles_fkey(first_name, last_name, phone)';

const VALIDATION_SELECT =
  'id, school_id, child_id, guardian_id, qr_code_id, scanner_user_id, status, refusal_reason, scanned_at, meta, created_at, child:children(id, first_name, last_name, photo_url, class_name), guardian:guardians(id, first_name, last_name, phone, photo_url, relationship, identity_status)';

export const schoolService = {
  async getSchoolByAdminUserId(userId: string): Promise<SchoolProfile | null> {
    const { data, error } = await supabase
      .from('schools')
      .select(SCHOOL_SELECT)
      .eq('admin_user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data as SchoolProfile | null;
  },

  async getSchoolById(schoolId: string): Promise<SchoolProfile | null> {
    const { data, error } = await supabase
      .from('schools')
      .select(SCHOOL_SELECT)
      .eq('id', schoolId)
      .maybeSingle();
    if (error) throw error;
    return data as SchoolProfile | null;
  },

  async updateSchool(
    schoolId: string,
    payload: UpdateSchoolPayload
  ): Promise<SchoolProfile> {
    const { data, error } = await supabase
      .from('schools')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', schoolId)
      .select(SCHOOL_SELECT)
      .single();
    if (error) throw error;
    return data as SchoolProfile;
  },

  async updateSchoolLogo(schoolId: string, logoUrl: string): Promise<void> {
    const { error } = await supabase
      .from('schools')
      .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
      .eq('id', schoolId);
    if (error) throw error;
  },

  async getEnrolledChildren(schoolId: string): Promise<SchoolChild[]> {
    const { data, error } = await supabase
      .from('children')
      .select(CHILD_SELECT)
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .order('last_name', { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as SchoolChild[];
  },

  async getPickupValidations(
    schoolId: string,
    limit = 30
  ): Promise<PickupValidation[]> {
    const { data, error } = await supabase
      .from('pickup_validations')
      .select(VALIDATION_SELECT)
      .eq('school_id', schoolId)
      .order('scanned_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as unknown as PickupValidation[];
  },

  async getTodayValidations(schoolId: string): Promise<PickupValidation[]> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('pickup_validations')
      .select(VALIDATION_SELECT)
      .eq('school_id', schoolId)
      .gte('scanned_at', start.toISOString())
      .order('scanned_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as PickupValidation[];
  },

  async getDashboardStats(schoolId: string): Promise<DashboardStats> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const [todayData, enrolledData] = await Promise.all([
      supabase
        .from('pickup_validations')
        .select('id, status, scanned_at, child_id')
        .eq('school_id', schoolId)
        .gte('scanned_at', start.toISOString()),
      supabase
        .from('children')
        .select('id')
        .eq('school_id', schoolId)
        .eq('is_active', true),
    ]);

    if (todayData.error) throw todayData.error;
    if (enrolledData.error) throw enrolledData.error;

    const today = todayData.data ?? [];
    const recentValidations = await this.getPickupValidations(schoolId, 10);

    return {
      todayValidations: today.filter(r => r.status === 'validated').length,
      todayRefusals: today.filter(r => r.status === 'refused').length,
      enrolledCount: (enrolledData.data ?? []).length,
      recentValidations,
    };
  },

  async validateQr(
    qrToken: string,
    schoolId: string,
    scannerUserId: string
  ): Promise<QrScanResult> {
    const { data, error } = await supabase.rpc(
      'validate_qr_and_create_pickup',
      {
        p_qr_token: qrToken,
        p_school_id: schoolId,
        p_scanner_user_id: scannerUserId,
      }
    );
    if (error) throw error;
    return data as QrScanResult;
  },
};
