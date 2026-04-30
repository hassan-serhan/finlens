import { supabase } from '@/lib/supabase';
import type { AllowanceEntry, AllowanceKind, AllowanceWallet, FamilyMember } from '@/types/db';

export async function listMembers(householdId: string): Promise<FamilyMember[]> {
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at');
  if (error) throw error;
  return (data ?? []) as FamilyMember[];
}

export async function getOrCreateWallet(member: FamilyMember): Promise<AllowanceWallet> {
  const { data: existing } = await supabase
    .from('allowance_wallets')
    .select('*')
    .eq('member_id', member.id)
    .maybeSingle();
  if (existing) return existing as AllowanceWallet;

  const { data, error } = await supabase
    .from('allowance_wallets')
    .insert({ member_id: member.id, household_id: member.household_id, balance: 0 })
    .select()
    .single();
  if (error) throw error;
  return data as AllowanceWallet;
}

export async function listEntries(walletId: string): Promise<AllowanceEntry[]> {
  const { data, error } = await supabase
    .from('allowance_entries')
    .select('*')
    .eq('wallet_id', walletId)
    .order('entry_date', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as AllowanceEntry[];
}

export async function recordAllowance(params: {
  wallet: AllowanceWallet;
  kind: AllowanceKind;
  amount: number;
  reason: string;
  approvedBy?: string | null;
}): Promise<{ wallet: AllowanceWallet; entry: AllowanceEntry }> {
  const { wallet, kind, amount, reason, approvedBy } = params;
  const delta = kind === 'credit' ? amount : -amount;
  const nextBalance = +(wallet.balance + delta).toFixed(2);

  const { data: entry, error: eErr } = await supabase
    .from('allowance_entries')
    .insert({
      wallet_id: wallet.id,
      kind,
      amount,
      reason,
      approved_by: approvedBy ?? null,
      entry_date: new Date().toISOString().slice(0, 10),
    })
    .select()
    .single();
  if (eErr) throw eErr;

  const { data: w, error: wErr } = await supabase
    .from('allowance_wallets')
    .update({ balance: nextBalance })
    .eq('id', wallet.id)
    .select()
    .single();
  if (wErr) throw wErr;

  return { wallet: w as AllowanceWallet, entry: entry as AllowanceEntry };
}

// Calls the invite-member edge function which provisions an auth user
// (admin-set password, no email confirmation) and a family_members row.
// Returns the new family_members row.
export async function inviteMember(params: {
  name: string;
  email: string;
  password: string;
  role: 'Admin' | 'Member';
  relation?: string;
  age?: number | null;
}): Promise<FamilyMember> {
  const { data, error } = await supabase.functions.invoke<{ member: FamilyMember }>(
    'invite-member',
    {
      body: {
        name: params.name,
        email: params.email,
        password: params.password,
        role: params.role,
        relation: params.relation ?? null,
        age: params.age ?? null,
      },
    }
  );
  if (error) throw new Error(error.message);
  if (!data?.member) throw new Error('Invite failed');
  return data.member;
}
