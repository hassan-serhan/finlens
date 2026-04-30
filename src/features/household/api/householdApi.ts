import { supabase } from '@/lib/supabase';
import type { FamilyMember, Household } from '@/types/db';

// Household + admin family_member are created by the `on_auth_user_created`
// Postgres trigger (see supabase/signup_trigger.sql). The client only reads.

export async function findMemberByUser(userId: string): Promise<FamilyMember | null> {
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as FamilyMember | null;
}

export async function getHousehold(id: string): Promise<Household> {
  const { data, error } = await supabase.from('households').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Household;
}
