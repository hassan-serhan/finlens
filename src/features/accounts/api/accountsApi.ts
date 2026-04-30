import { supabase } from '@/lib/supabase';
import type { Account, AccountKind } from '@/types/db';

export async function listAccounts(householdId: string): Promise<Account[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('household_id', householdId)
    .order('kind');
  if (error) throw error;
  return (data ?? []) as Account[];
}

export async function setAccountBalance(accountId: string, balance: number): Promise<void> {
  const { error } = await supabase.from('accounts').update({ balance }).eq('id', accountId);
  if (error) throw error;
}

export async function adjustAccountBalance(
  accountId: string,
  currentBalance: number,
  delta: number
): Promise<number> {
  const next = +(currentBalance + delta).toFixed(2);
  await setAccountBalance(accountId, next);
  return next;
}

export function findAccount(accounts: Account[], kind: AccountKind): Account | undefined {
  return accounts.find((a) => a.kind === kind);
}

export async function getAccountByKind(
  householdId: string,
  kind: AccountKind
): Promise<Account | null> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('household_id', householdId)
    .eq('kind', kind)
    .maybeSingle();
  if (error) throw error;
  return (data as Account | null) ?? null;
}
