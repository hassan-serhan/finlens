import { useCallback, useEffect, useState } from 'react';
import { firstOfMonthISO } from '@/lib/format';
import { listGoals, listHouseholdContributions } from '../api/goalsApi';
import { listDebts, listHouseholdDebtPayments } from '../api/debtsApi';
import type { Debt, GoalContribution, DebtPayment, SavingsGoal } from '@/types/db';

export type ContributionActivity =
  | { kind: 'goal'; entry: GoalContribution; goal: SavingsGoal }
  | { kind: 'debt'; entry: DebtPayment; debt: Debt };

type State = {
  goals: SavingsGoal[];
  debts: Debt[];
  monthActivity: ContributionActivity[];
  monthTotal: number;
  loading: boolean;
  reload: () => Promise<void>;
};

export function useGoalsAndDebts(householdId: string | null): State {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [monthActivity, setMonthActivity] = useState<ContributionActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!householdId) {
      setGoals([]);
      setDebts([]);
      setMonthActivity([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const since = firstOfMonthISO();
    const [g, d] = await Promise.all([listGoals(householdId), listDebts(householdId)]);
    setGoals(g);
    setDebts(d);

    // Pull this month's contributions and payments in parallel. The list
    // helpers also fetch goals/debts to scope the IN(...), so we pass the
    // already-known IDs to avoid the redundant round-trip.
    const goalIds = g.map((x) => x.id);
    const debtIds = d.map((x) => x.id);

    const [gc, dp] = await Promise.all([
      goalIds.length
        ? listHouseholdContributions(householdId, since)
        : Promise.resolve<GoalContribution[]>([]),
      debtIds.length
        ? listHouseholdDebtPayments(householdId, since)
        : Promise.resolve<DebtPayment[]>([]),
    ]);

    const goalsById = Object.fromEntries(g.map((x) => [x.id, x]));
    const debtsById = Object.fromEntries(d.map((x) => [x.id, x]));

    const merged: ContributionActivity[] = [
      ...gc
        .filter((c) => goalsById[c.goal_id])
        .map((entry) => ({
          kind: 'goal' as const,
          entry,
          goal: goalsById[entry.goal_id],
        })),
      ...dp
        .filter((p) => debtsById[p.debt_id])
        .map((entry) => ({
          kind: 'debt' as const,
          entry,
          debt: debtsById[entry.debt_id],
        })),
    ].sort((a, b) => {
      const da = a.kind === 'goal' ? a.entry.contributed_at : a.entry.paid_at;
      const db = b.kind === 'goal' ? b.entry.contributed_at : b.entry.paid_at;
      return db.localeCompare(da);
    });

    setMonthActivity(merged);
    setLoading(false);
  }, [householdId]);

  useEffect(() => {
    void load();
  }, [load]);

  const monthTotal = monthActivity.reduce((s, a) => s + Number(a.entry.amount), 0);

  return { goals, debts, monthActivity, monthTotal, loading, reload: load };
}
