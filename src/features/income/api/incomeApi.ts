import { supabase } from '@/lib/supabase';
import { firstOfMonthISO } from '@/lib/format';
import type { IncomeSource } from '@/types/db';
import { adjustAccountBalance, listAccounts } from '@/features/accounts/api/accountsApi';

export async function listIncomeForCurrentMonth(householdId: string): Promise<IncomeSource[]> {
  const start = firstOfMonthISO();
  const { data, error } = await supabase
    .from('income_sources')
    .select('*')
    .eq('household_id', householdId)
    .gte('income_date', start)
    .order('income_date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as IncomeSource[];
}

export type AddIncomeInput = {
  source: string;
  description?: string;
  amount: number;
  income_date: string;
  color?: string | null;
  recurring?: boolean;
  created_by?: string | null;
};

export async function addIncome(
  householdId: string,
  input: AddIncomeInput
): Promise<IncomeSource> {
  const { data, error } = await supabase
    .from('income_sources')
    .insert({ household_id: householdId, ...input })
    .select()
    .single();
  if (error) throw error;

  // Credit the main account.
  const accounts = await listAccounts(householdId);
  const main = accounts.find((a) => a.kind === 'main');
  if (main) {
    await adjustAccountBalance(main.id, main.balance, input.amount);
  }

  return data as IncomeSource;
}

export async function deleteIncome(income: IncomeSource): Promise<void> {
  const { error } = await supabase.from('income_sources').delete().eq('id', income.id);
  if (error) throw error;
  // Reverse the credit on the main account.
  const accounts = await listAccounts(income.household_id);
  const main = accounts.find((a) => a.kind === 'main');
  if (main) {
    await adjustAccountBalance(main.id, main.balance, -income.amount);
  }
}
