import { supabase } from '@/lib/supabase/client';
import type {
  AddAuthorizedPersonPayload,
  AddChildPayload,
  AuthorizedPerson,
  Child,
  ParentProfile,
  PickupLog,
  UpdateAuthorizedPersonPayload,
  UpdateProfilePayload,
} from '../types';

export const parentService = {
  async getProfile(userId: string): Promise<ParentProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
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

  async getChildren(parentUserId: string): Promise<Child[]> {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('parent_user_id', parentUserId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Child[];
  },

  async getChild(childId: string): Promise<Child> {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('id', childId)
      .single();
    if (error) throw error;
    return data as Child;
  },

  async addChild(
    parentUserId: string,
    payload: AddChildPayload
  ): Promise<Child> {
    const { data, error } = await supabase
      .from('children')
      .insert({
        parent_user_id: parentUserId,
        first_name: payload.first_name,
        last_name: payload.last_name,
        date_of_birth: payload.date_of_birth,
        grade: payload.grade,
        school_name: payload.school_name,
        photo_url: payload.photo_url ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data as Child;
  },

  async updateChild(
    childId: string,
    payload: Partial<AddChildPayload>
  ): Promise<Child> {
    const { data, error } = await supabase
      .from('children')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', childId)
      .select()
      .single();
    if (error) throw error;
    return data as Child;
  },

  async deleteChild(childId: string): Promise<void> {
    const { error } = await supabase
      .from('children')
      .delete()
      .eq('id', childId);
    if (error) throw error;
  },

  async getAuthorizedPersons(childId: string): Promise<AuthorizedPerson[]> {
    const { data, error } = await supabase
      .from('authorized_persons')
      .select('*')
      .eq('child_id', childId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as AuthorizedPerson[];
  },

  async getAuthorizedPerson(personId: string): Promise<AuthorizedPerson> {
    const { data, error } = await supabase
      .from('authorized_persons')
      .select('*')
      .eq('id', personId)
      .single();
    if (error) throw error;
    return data as AuthorizedPerson;
  },

  async addAuthorizedPerson(
    parentUserId: string,
    payload: AddAuthorizedPersonPayload
  ): Promise<AuthorizedPerson> {
    const { data, error } = await supabase
      .from('authorized_persons')
      .insert({
        parent_user_id: parentUserId,
        child_id: payload.child_id,
        first_name: payload.first_name,
        last_name: payload.last_name,
        phone: payload.phone,
        relation: payload.relation,
        is_active: true,
        valid_until: payload.valid_until,
        notes: payload.notes,
      })
      .select()
      .single();
    if (error) throw error;
    return data as AuthorizedPerson;
  },

  async updateAuthorizedPerson(
    personId: string,
    payload: UpdateAuthorizedPersonPayload
  ): Promise<AuthorizedPerson> {
    const { data, error } = await supabase
      .from('authorized_persons')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', personId)
      .select()
      .single();
    if (error) throw error;
    return data as AuthorizedPerson;
  },

  async toggleAuthorizedPerson(
    personId: string,
    isActive: boolean
  ): Promise<void> {
    const { error } = await supabase
      .from('authorized_persons')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', personId);
    if (error) throw error;
  },

  async deleteAuthorizedPerson(personId: string): Promise<void> {
    const { error } = await supabase
      .from('authorized_persons')
      .delete()
      .eq('id', personId);
    if (error) throw error;
  },

  async getPickupLogs(parentUserId: string, limit = 50): Promise<PickupLog[]> {
    const { data, error } = await supabase
      .from('pickup_logs')
      .select(
        `
        *,
        child:children(first_name, last_name, photo_url),
        authorized_person:authorized_persons(first_name, last_name, relation)
      `
      )
      .eq('children.parent_user_id', parentUserId)
      .order('scanned_at', { ascending: false })
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
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, arrayBuffer, {
        contentType,
        upsert: true,
        cacheControl: '3600',
      });
    if (error) throw error;

    const { data: signedData, error: signedError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 60 * 60 * 24 * 7);
    if (signedError) throw signedError;
    return signedData.signedUrl;
  },
};
