import { supabase } from '@/lib/supabase';
import { InsufficientFundsError } from '@/lib/errors';
import { todayISO } from '@/lib/format';
import type { AllowanceEntry, AllowanceWallet, FamilyMember } from '@/types/db';

export async function getOrCreateWallet(member: FamilyMember): Promise<AllowanceWallet> {
  const { data: existing, error: selErr } = await supabase
    .from('allowance_wallets')
    .select('*')
    .eq('member_id', member.id)
    .maybeSingle();
  if (selErr) throw selErr;
  if (existing) return existing as AllowanceWallet;

  const { data, error } = await supabase
    .from('allowance_wallets')
    .insert({ member_id: member.id, household_id: member.household_id, balance: 0 })
    .select()
    .single();
  if (error) throw error;
  return data as AllowanceWallet;
}

export async function listWalletEntries(
  walletId: string,
  limit?: number
): Promise<AllowanceEntry[]> {
  let q = supabase
    .from('allowance_entries')
    .select('*')
    .eq('wallet_id', walletId)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AllowanceEntry[];
}

// Spend from a member's wallet. Throws InsufficientFundsError if the balance
// can't cover the charge. The entry's reason describes the purchase
// (e.g. "Expense: Coffee", "Goal: New Bike", "Debt: Credit card").
export async function chargeWallet(params: {
  member: FamilyMember;
  amount: number;
  reason: string;
  entryDate?: string;
}): Promise<{ wallet: AllowanceWallet; entry: AllowanceEntry }> {
  const { member, amount, reason, entryDate } = params;
  const wallet = await getOrCreateWallet(member);
  const available = Number(wallet.balance);
  if (amount > available) {
    throw new InsufficientFundsError('wallet', available, amount);
  }

  const { data: entry, error: eErr } = await supabase
    .from('allowance_entries')
    .insert({
      wallet_id: wallet.id,
      kind: 'debit',
      amount,
      reason,
      approved_by: null,
      entry_date: entryDate ?? todayISO(),
    })
    .select()
    .single();
  if (eErr) throw eErr;

  const nextBalance = +(available - amount).toFixed(2);
  const { data: w, error: wErr } = await supabase
    .from('allowance_wallets')
    .update({ balance: nextBalance })
    .eq('id', wallet.id)
    .select()
    .single();
  if (wErr) throw wErr;

  return { wallet: w as AllowanceWallet, entry: entry as AllowanceEntry };
}
