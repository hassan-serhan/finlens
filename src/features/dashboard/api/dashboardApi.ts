import { supabase } from '@/lib/supabase';
import { firstOfMonthISO, todayISO } from '@/lib/format';
import { listAccounts } from '@/features/accounts/api/accountsApi';
import { getCategorySpendForMonth, listTransactions } from '@/features/expenses/api/expensesApi';
import { listGoals } from '@/features/goalsAndDebts/api/goalsApi';
import { listDebts } from '@/features/goalsAndDebts/api/debtsApi';
import type {
  Account,
  Debt,
  DebtPayment,
  GoalContribution,
  SavingsGoal,
} from '@/types/db';
import type { CategorySpend, Transaction } from '@/features/expenses/api/expensesApi';

export type DashboardSnapshot = {
  // Reference month start (ISO yyyy-mm-dd) the snapshot is scoped to.
  monthStart: string;

  accounts: Account[];
  categorySpend: CategorySpend[];
  goals: SavingsGoal[];
  debts: Debt[];

  // Transactions that fall within the current month.
  monthTransactions: Transaction[];

  // Goal contributions + debt payments since the start of the month.
  monthContributions: GoalContribution[];
  monthDebtPayments: DebtPayment[];
};

// Direct queries scoped to known goal/debt IDs — avoid the redundant
// `listGoals` / `listDebts` round-trips inside the canonical
// `listHouseholdContributions` / `listHouseholdDebtPayments` helpers.
async function listContributionsForGoals(
  goalIds: string[],
  sinceISO: string
): Promise<GoalContribution[]> {
  if (goalIds.length === 0) return [];
  const { data, error } = await supabase
    .from('goal_contributions')
    .select('*')
    .in('goal_id', goalIds)
    .gte('contributed_at', sinceISO)
    .order('contributed_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as GoalContribution[];
}

async function listPaymentsForDebts(
  debtIds: string[],
  sinceISO: string
): Promise<DebtPayment[]> {
  if (debtIds.length === 0) return [];
  const { data, error } = await supabase
    .from('debt_payments')
    .select('*')
    .in('debt_id', debtIds)
    .gte('paid_at', sinceISO)
    .order('paid_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DebtPayment[];
}

// Fetches everything the dashboard needs in two parallel waves. Wave 1 grabs
// independent data (accounts, categories+budgets, goals, debts, transactions);
// wave 2 needs the goal/debt IDs from wave 1 to scope the IN(...) queries.
// Total: 5 + 2 = 7 round-trips, all bundled into 2 awaits.
export async function loadDashboardSnapshot(
  householdId: string
): Promise<DashboardSnapshot> {
  const monthStart = firstOfMonthISO();
  const today = todayISO();

  const [accounts, categorySpend, goals, debts, monthTransactions] = await Promise.all([
    listAccounts(householdId),
    getCategorySpendForMonth(householdId),
    listGoals(householdId),
    listDebts(householdId),
    listTransactions({ householdId, fromDate: monthStart, toDate: today }),
  ]);

  const [monthContributions, monthDebtPayments] = await Promise.all([
    listContributionsForGoals(goals.map((g) => g.id), monthStart),
    listPaymentsForDebts(debts.map((d) => d.id), monthStart),
  ]);

  return {
    monthStart,
    accounts,
    categorySpend,
    goals,
    debts,
    monthTransactions,
    monthContributions,
    monthDebtPayments,
  };
}
