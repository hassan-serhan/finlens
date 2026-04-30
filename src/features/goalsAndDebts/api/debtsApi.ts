import { supabase } from '@/lib/supabase';
import { adjustAccountBalance, getAccountByKind } from '@/features/accounts/api/accountsApi';
import { chargeWallet } from '@/features/wallet/api/walletApi';
import { InsufficientFundsError } from '@/lib/errors';
import type { Debt, DebtPayment, FamilyMember, Priority } from '@/types/db';

export async function listDebts(householdId: string): Promise<Debt[]> {
  const { data, error } = await supabase
    .from('debts')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Debt[];
}

export type AddDebtInput = {
  name: string;
  description?: string | null;
  total: number;
  monthly_payment?: number | null;
  interest_rate?: number | null;
  payoff_date?: string | null;
  icon?: string | null;
  priority: Priority;
};

export async function addDebt(householdId: string, input: AddDebtInput): Promise<Debt> {
  const { data, error } = await supabase
    .from('debts')
    .insert({
      household_id: householdId,
      name: input.name,
      description: input.description ?? null,
      total: input.total,
      paid: 0,
      monthly_payment: input.monthly_payment ?? null,
      interest_rate: input.interest_rate ?? null,
      payoff_date: input.payoff_date ?? null,
      icon: input.icon ?? '💳',
      priority: input.priority,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Debt;
}

export async function deleteDebt(debtId: string): Promise<void> {
  const { error } = await supabase.from('debts').delete().eq('id', debtId);
  if (error) throw error;
}

export async function listDebtPayments(debtId: string): Promise<DebtPayment[]> {
  const { data, error } = await supabase
    .from('debt_payments')
    .select('*')
    .eq('debt_id', debtId)
    .order('paid_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DebtPayment[];
}

export async function listHouseholdDebtPayments(
  householdId: string,
  sinceISO: string
): Promise<DebtPayment[]> {
  const debts = await listDebts(householdId);
  if (debts.length === 0) return [];
  const debtIds = debts.map((d) => d.id);
  const { data, error } = await supabase
    .from('debt_payments')
    .select('*')
    .in('debt_id', debtIds)
    .gte('paid_at', sinceISO)
    .order('paid_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DebtPayment[];
}

// Debt payment source-of-funds:
//   - Admin: Main account.
//   - Member: their wallet.
// Pre-flights InsufficientFundsError before recording the payment.
export async function payDebt(params: {
  debt: Debt;
  amount: number;
  member: FamilyMember;
  paidAt: string;
}): Promise<void> {
  const { debt, amount, member, paidAt } = params;
  const isAdmin = member.role === 'Admin';

  if (isAdmin) {
    const main = await getAccountByKind(debt.household_id, 'main');
    const available = main ? Number(main.balance) : 0;
    if (amount > available) throw new InsufficientFundsError('main', available, amount);
    await adjustAccountBalance(main!.id, main!.balance, -amount);
  } else {
    await chargeWallet({
      member,
      amount,
      reason: `Debt: ${debt.name}`,
      entryDate: paidAt,
    });
  }

  const { error: insErr } = await supabase.from('debt_payments').insert({
    debt_id: debt.id,
    member_id: member.id,
    amount,
    paid_at: paidAt,
  });
  if (insErr) throw insErr;

  const nextPaid = +(Number(debt.paid) + amount).toFixed(2);
  const { error: updErr } = await supabase
    .from('debts')
    .update({ paid: nextPaid })
    .eq('id', debt.id);
  if (updErr) throw updErr;
}
