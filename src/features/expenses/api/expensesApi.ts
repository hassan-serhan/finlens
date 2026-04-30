import { supabase } from '@/lib/supabase';
import type { Category, FamilyMember } from '@/types/db';
import { adjustAccountBalance, getAccountByKind, listAccounts } from '@/features/accounts/api/accountsApi';
import { chargeWallet } from '@/features/wallet/api/walletApi';
import { InsufficientFundsError } from '@/lib/errors';

export type Transaction = {
  id: string;
  household_id: string;
  account_id: string | null;
  category_id: string | null;
  member_id: string | null;
  description: string;
  amount: number;
  txn_date: string;
  note: string | null;
  created_at: string;
};

export async function listTransactions(params: {
  householdId: string;
  fromDate: string;
  toDate: string;
  memberId?: string | null;
}): Promise<Transaction[]> {
  let q = supabase
    .from('transactions')
    .select('*')
    .eq('household_id', params.householdId)
    .gte('txn_date', params.fromDate)
    .lte('txn_date', params.toDate)
    .order('txn_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (params.memberId) q = q.eq('member_id', params.memberId);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Transaction[];
}

export type AddExpenseInput = {
  description: string;
  amount: number;
  category_id: string;
  txn_date: string;
  note?: string;
  member: FamilyMember;
};

// Source of funds for an expense:
//   - Admin: Main account.
//   - Member: their wallet.
// Pre-flights InsufficientFundsError before inserting the transaction.
export async function addExpense(
  householdId: string,
  input: AddExpenseInput
): Promise<Transaction> {
  const isAdmin = input.member.role === 'Admin';
  const main = isAdmin ? await getAccountByKind(householdId, 'main') : null;

  if (isAdmin) {
    const available = main ? Number(main.balance) : 0;
    if (input.amount > available) throw new InsufficientFundsError('main', available, input.amount);
  } else {
    await chargeWallet({
      member: input.member,
      amount: input.amount,
      reason: `Expense: ${input.description}`,
      entryDate: input.txn_date,
    });
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      household_id: householdId,
      account_id: main?.id ?? null,
      category_id: input.category_id,
      member_id: input.member.id,
      description: input.description,
      amount: input.amount,
      txn_date: input.txn_date,
      note: input.note ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  if (isAdmin && main) {
    await adjustAccountBalance(main.id, main.balance, -input.amount);
  }

  return data as Transaction;
}

export async function deleteExpense(txn: Transaction): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', txn.id);
  if (error) throw error;
  // Reverse the main-account deduction. Wallet-funded expenses don't get
  // refunded automatically; admins can credit the wallet from Family if needed.
  const accounts = await listAccounts(txn.household_id);
  const main = accounts.find((a) => a.kind === 'main');
  if (main && txn.account_id === main.id) {
    await adjustAccountBalance(main.id, main.balance, +txn.amount);
  }
}

export type CategorySpend = {
  category: Category;
  budget: number;
  spent: number;
};

type CategorySpendRow = {
  category_id: string;
  slug: string;
  label: string;
  icon: string | null;
  color: string | null;
  budget: number;
  spent: number;
};

// Calls the get_category_spend_for_month RPC — one round-trip instead of
// 3 sequential client queries (transactions sum + monthly_budget + category_budgets).
export async function getCategorySpendForMonth(
  householdId: string
): Promise<CategorySpend[]> {
  const { data, error } = await supabase.rpc('get_category_spend_for_month', {
    p_household_id: householdId,
  });
  if (error) throw error;

  return ((data ?? []) as CategorySpendRow[]).map((r) => ({
    category: {
      id: r.category_id,
      household_id: householdId,
      slug: r.slug,
      label: r.label,
      icon: r.icon,
      color: r.color,
    },
    budget: Number(r.budget),
    spent: Number(r.spent),
  }));
}
