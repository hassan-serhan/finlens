import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadDashboardSnapshot, type DashboardSnapshot } from '../api/dashboardApi';

export type DashboardKpis = {
  // Sum of transactions this month.
  monthSpent: number;
  // Sum of monthly category budgets (admin can leave empty).
  monthBudget: number;
  // Sum of contributions to goals this month.
  monthSaved: number;
  // Sum of debt payments this month.
  monthDebtPaid: number;
  // Lifetime saved across all goals (uses goal.saved snapshot).
  totalSaved: number;
  totalGoalsTarget: number;
  // Aggregate debt: total - paid (snapshot, includes prior months).
  debtRemaining: number;
  debtTotal: number;
  debtPaid: number;
  debtPct: number;
  // Spent / budget percent (clamped 0..100 only used for ring helpers).
  budgetUsedPct: number;
};

type State = {
  data: DashboardSnapshot | null;
  kpis: DashboardKpis | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

// Loads + memoizes the dashboard snapshot, and pre-computes the KPI numbers
// (monthSpent, totals, percentages) so consumer components don't re-derive.
export function useDashboard(householdId: string | null): State {
  const [data, setData] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!householdId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const snap = await loadDashboardSnapshot(householdId);
      setData(snap);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load dashboard');
    } finally {
      setLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    void load();
  }, [load]);

  const kpis = useMemo<DashboardKpis | null>(() => {
    if (!data) return null;

    const monthSpent = data.monthTransactions.reduce((s, t) => s + Number(t.amount), 0);
    const monthBudget = data.categorySpend.reduce((s, c) => s + Number(c.budget), 0);
    const monthSaved = data.monthContributions.reduce((s, c) => s + Number(c.amount), 0);
    const monthDebtPaid = data.monthDebtPayments.reduce((s, p) => s + Number(p.amount), 0);

    const totalSaved = data.goals.reduce((s, g) => s + Number(g.saved), 0);
    const totalGoalsTarget = data.goals.reduce((s, g) => s + Number(g.target), 0);

    const debtTotal = data.debts.reduce((s, d) => s + Number(d.total), 0);
    const debtPaid = data.debts.reduce((s, d) => s + Number(d.paid), 0);
    const debtRemaining = Math.max(debtTotal - debtPaid, 0);
    const debtPct = debtTotal > 0 ? Math.round((debtPaid / debtTotal) * 100) : 0;

    const budgetUsedPct =
      monthBudget > 0 ? Math.min(Math.round((monthSpent / monthBudget) * 100), 999) : 0;

    return {
      monthSpent,
      monthBudget,
      monthSaved,
      monthDebtPaid,
      totalSaved,
      totalGoalsTarget,
      debtRemaining,
      debtTotal,
      debtPaid,
      debtPct,
      budgetUsedPct,
    };
  }, [data]);

  return { data, kpis, loading, error, reload: load };
}
