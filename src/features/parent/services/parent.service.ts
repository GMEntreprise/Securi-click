import { supabase } from '@/lib/supabase/client';
import type {
  AddGuardianPayload,
  AddChildPayload,
  Guardian,
  Child,
  ParentProfile,
  PickupLog,
  UpdateGuardianPayload,
  UpdateProfilePayload,
} from '../types';

export const parentService = {
  async getProfile(userId: string): Promise<ParentProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(
        'id, user_id, first_name, last_name, phone, avatar_url, role, school_id, created_at, updated_at'
      )
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return data as ParentProfile;
  },

  async updateProfile(
    userId: string,
    payload: UpdateProfilePayload
  ): Promise<ParentProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        first_name: payload.first_name,
        last_name: payload.last_name,
        phone: payload.phone,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data as ParentProfile;
  },

  async updateAvatar(userId: string, avatarUrl: string): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) throw error;
  },

  async changePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  async getChildren(parentId: string): Promise<Child[]> {
    const { data, error } = await supabase
      .from('children')
      .select(
        'id, parent_id, school_id, first_name, last_name, date_of_birth, photo_url, class_name, medical_notes, is_active, created_at, updated_at, school:schools ( id, name, city, type, verified, external_id )'
      )
      .eq('parent_id', parentId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Child[];
  },

  async getChild(childId: string): Promise<Child> {
    const { data, error } = await supabase
      .from('children')
      .select(
        'id, parent_id, school_id, first_name, last_name, date_of_birth, photo_url, class_name, medical_notes, is_active, created_at, updated_at, school:schools ( id, name, city, type, verified, external_id )'
      )
      .eq('id', childId)
      .single();
    if (error) throw error;
    return data as unknown as Child;
  },

  async addChild(parentId: string, payload: AddChildPayload): Promise<Child> {
    const { data, error } = await supabase
      .from('children')
      .insert({
        parent_id: parentId,
        first_name: payload.first_name,
        last_name: payload.last_name,
        date_of_birth: payload.date_of_birth,
        class_name: payload.class_name,
        school_id: payload.school_id ?? null,
        photo_url: payload.photo_url ?? null,
        medical_notes: payload.medical_notes ?? null,
      })
      .select(
        'id, parent_id, school_id, first_name, last_name, date_of_birth, photo_url, class_name, medical_notes, is_active, created_at, updated_at, school:schools ( id, name, city, type, verified, external_id )'
      )
      .single();
    if (error) throw error;
    return data as unknown as Child;
  },

  async updateChild(
    childId: string,
    payload: Partial<AddChildPayload>
  ): Promise<Child> {
    const { error } = await supabase
      .from('children')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', childId);
    if (error) throw error;
    const { data, error: fetchError } = await supabase
      .from('children')
      .select(
        'id, parent_id, school_id, first_name, last_name, date_of_birth, photo_url, class_name, medical_notes, is_active, created_at, updated_at, school:schools ( id, name, city, type, verified, external_id )'
      )
      .eq('id', childId)
      .single();
    if (fetchError) throw fetchError;
    return data as unknown as Child;
  },

  async deleteChild(childId: string): Promise<void> {
    const { error } = await supabase
      .from('children')
      .delete()
      .eq('id', childId);
    if (error) throw error;
  },

  async getExistingCollectors(parentId: string): Promise<Guardian[]> {
    // Include collectors who have accepted (collector_user_id set) AND
    // collectors who have a PIN defined but haven't accepted yet (access_code_hash set).
    const { data, error } = await supabase
      .from('guardians')
      .select(
        'id, parent_id, child_id, first_name, last_name, phone, email, relationship, photo_url, priority, is_active, created_at, updated_at, collector_user_id, access_code_hash'
      )
      .eq('parent_id', parentId)
      .or('collector_user_id.not.is.null,access_code_hash.not.is.null')
      .order('first_name', { ascending: true });
    if (error) throw error;
    // Deduplicate: prefer the row with collector_user_id set, then deduplicate by
    // collector_user_id (accepted) or email (pending). One entry per real person.
    const byCollectorId = new Map<string, Guardian>();
    const byEmail = new Map<string, Guardian>();
    for (const row of (data ?? []) as Guardian[]) {
      if (row.collector_user_id) {
        byCollectorId.set(row.collector_user_id, row);
      } else if (row.email) {
        if (!byEmail.has(row.email)) byEmail.set(row.email, row);
      }
    }
    // Merge: accepted collectors take priority over pending ones with same email
    const result = new Map<string, Guardian>();
    for (const [, g] of byCollectorId) {
      const key = g.email ?? g.id;
      result.set(key, g);
    }
    for (const [email, g] of byEmail) {
      if (!result.has(email)) result.set(email, g);
    }
    return Array.from(result.values()).sort((a, b) =>
      a.first_name.localeCompare(b.first_name)
    );
  },

  async linkCollectorToChild(
    parentId: string,
    childId: string,
    payload: {
      collector_user_id: string | null;
      access_code_hash: string | null;
      first_name: string;
      last_name: string;
      phone: string | null;
      email: string | null;
      relationship: string;
    }
  ): Promise<Guardian> {
    // Path A — collector has already accepted: direct INSERT with collector_user_id
    if (payload.collector_user_id) {
      const { data, error } = await supabase
        .from('guardians')
        .insert({
          parent_id: parentId,
          child_id: childId,
          collector_user_id: payload.collector_user_id,
          first_name: payload.first_name,
          last_name: payload.last_name,
          phone: payload.phone ?? null,
          email: payload.email ?? null,
          relationship: payload.relationship,
          is_active: true,
          priority: 1,
        })
        .select(
          'id, parent_id, child_id, first_name, last_name, phone, email, relationship, photo_url, priority, is_active, created_at, updated_at, collector_user_id, access_code_hash'
        )
        .single();
      if (error) {
        if (error.code === '23505') {
          throw new Error('Ce collecteur est déjà autorisé pour cet enfant.');
        }
        throw error;
      }
      return data as Guardian;
    }

    // Path B — pending invitation: call invite_guardian RPC
    if (!payload.email) {
      throw new Error("Impossible d'identifier ce collecteur.");
    }

    const { error: rpcError } = await supabase.rpc('invite_guardian', {
      p_child_id: childId,
      p_first_name: payload.first_name,
      p_last_name: payload.last_name,
      p_phone: payload.phone,
      p_relationship: payload.relationship,
      p_access_code_hash: payload.access_code_hash ?? null,
      p_email: payload.email,
    });
    if (rpcError) {
      if (
        rpcError.message.includes('duplicate_guardian_email') ||
        rpcError.code === '23505'
      ) {
        throw new Error('Ce collecteur est déjà associé à cet enfant.');
      }
      throw new Error(rpcError.message);
    }

    const { data, error } = await supabase
      .from('guardians')
      .select(
        'id, parent_id, child_id, first_name, last_name, phone, email, relationship, photo_url, priority, is_active, created_at, updated_at, collector_user_id, access_code_hash'
      )
      .eq('child_id', childId)
      .eq('email', payload.email.toLowerCase().trim())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (error) throw error;
    return data as Guardian;
  },

  async getGuardians(childId: string): Promise<Guardian[]> {
    const { data, error } = await supabase
      .from('guardians')
      .select(
        'id, parent_id, child_id, first_name, last_name, phone, email, relationship, photo_url, priority, is_active, created_at, updated_at'
      )
      .eq('child_id', childId)
      .order('priority', { ascending: true });
    if (error) throw error;
    return (data ?? []) as Guardian[];
  },

  async getGuardian(guardianId: string): Promise<Guardian> {
    const { data, error } = await supabase
      .from('guardians')
      .select(
        'id, parent_id, child_id, first_name, last_name, phone, email, relationship, photo_url, priority, is_active, created_at, updated_at'
      )
      .eq('id', guardianId)
      .single();
    if (error) throw error;
    return data as Guardian;
  },

  async addGuardian(
    parentId: string,
    payload: AddGuardianPayload
  ): Promise<Guardian> {
    const { data, error } = await supabase
      .from('guardians')
      .insert({
        parent_id: parentId,
        child_id: payload.child_id,
        first_name: payload.first_name,
        last_name: payload.last_name,
        phone: payload.phone,
        email: payload.email ?? null,
        relationship: payload.relationship,
        photo_url: payload.photo_url ?? null,
        priority: payload.priority ?? 1,
        is_active: true,
      })
      .select()
      .single();
    if (error) throw error;
    return data as Guardian;
  },

  async updateGuardian(
    guardianId: string,
    payload: UpdateGuardianPayload
  ): Promise<Guardian> {
    // Fetch the target row first to get collector_user_id + parent_id
    const { data: target, error: fetchError } = await supabase
      .from('guardians')
      .select('id, parent_id, collector_user_id')
      .eq('id', guardianId)
      .single();
    if (fetchError) throw fetchError;

    const updatePayload = { ...payload, updated_at: new Date().toISOString() };

    // If this collector is linked to multiple children (same collector_user_id),
    // propagate common fields to all their guardian rows under this parent.
    if (target.collector_user_id) {
      await supabase
        .from('guardians')
        .update(updatePayload)
        .eq('parent_id', target.parent_id)
        .eq('collector_user_id', target.collector_user_id)
        .neq('id', guardianId);
    }

    // Update the target row and return it
    const { data, error } = await supabase
      .from('guardians')
      .update(updatePayload)
      .eq('id', guardianId)
      .select(
        'id, parent_id, child_id, first_name, last_name, phone, email, relationship, photo_url, priority, is_active, created_at, updated_at'
      )
      .single();
    if (error) throw error;
    return data as Guardian;
  },

  async toggleGuardian(guardianId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('guardians')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', guardianId);
    if (error) throw error;
  },

  async deleteGuardian(guardianId: string): Promise<void> {
    const { error } = await supabase
      .from('guardians')
      .delete()
      .eq('id', guardianId);
    if (error) throw error;
  },

  async getPickupLogs(parentId: string, limit = 50): Promise<PickupLog[]> {
    const { data, error } = await supabase
      .from('pickup_logs')
      .select(
        `
        *,
        child:children!inner(first_name, last_name, photo_url),
        guardian:guardians(first_name, last_name, relationship)
      `
      )
      .eq('children.parent_id', parentId)
      .order('pickup_time', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as PickupLog[];
  },

  async uploadImage(
    bucket: 'profile-images' | 'children-images',
    filePath: string,
    arrayBuffer: ArrayBuffer,
    contentType: string
  ): Promise<string> {
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
    if (!ALLOWED.includes(contentType)) {
      throw new Error('Format image non supporté. Utilisez JPG, PNG ou WebP.');
    }
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, arrayBuffer, {
        contentType,
        upsert: true,
        cacheControl: '3600',
      });
    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  },
};
