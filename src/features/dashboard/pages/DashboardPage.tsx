import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useHousehold } from '@/features/household/hooks/useHousehold';
import { useHouseholdData } from '@/contexts/HouseholdDataContext';
import { WalletCard } from '@/features/wallet/components/WalletCard';
import { formatMoney } from '@/lib/format';
import { useDashboard } from '../hooks/useDashboard';
import { StatRow } from '../components/StatRow';
import { BudgetRing } from '../components/BudgetRing';
import { SpendingBars } from '../components/SpendingBars';
import { DailySpendChart } from '../components/DailySpendChart';
import { GoalsStrip } from '../components/GoalsStrip';
import { ActivityFeed } from '../components/ActivityFeed';
import '../components/Dashboard.css';

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { householdId, member, loading: hhLoading, error: hhError } = useHousehold();
  const { membersById, categoriesById } = useHouseholdData();
  const { data, kpis, loading, error } = useDashboard(householdId);

  const isMember = member?.role === 'Member';

  // Pre-compute lookup tables once.
  const goalsById = useMemo(
    () => Object.fromEntries((data?.goals ?? []).map((g) => [g.id, g])),
    [data?.goals]
  );
  const debtsById = useMemo(
    () => Object.fromEntries((data?.debts ?? []).map((d) => [d.id, d])),
    [data?.debts]
  );

  // Categories that contribute to the ring — must have a non-zero monthly
  // budget. Sorted by budget desc so the largest slice is listed first; falls
  // back to spend desc when budgets tie.
  const ringCategories = useMemo(() => {
    if (!data) return [];
    return data.categorySpend
      .filter((c) => Number(c.budget) > 0)
      .sort((a, b) => {
        const db = Number(b.budget) - Number(a.budget);
        return db !== 0 ? db : Number(b.spent) - Number(a.spent);
      });
  }, [data]);

  const monthName = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, { month: 'long' }).format(new Date()),
    [i18n.language]
  );

  return (
    <AppLayout>
      <header style={{ marginBlockEnd: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
          {member ? t('dashboard.greeting', { name: firstName(member.name) }) : t('nav.dashboard')}
        </h1>
        <p style={{ color: 'var(--neutral-500)', margin: '4px 0 0', fontSize: 13.5 }}>
          {t('dashboard.subtitle')}
        </p>
      </header>

      {hhLoading && <div className="empty">{t('common.loading')}</div>}
      {hhError && <div className="empty" style={{ color: 'var(--danger)' }}>{hhError}</div>}

      {householdId && member && isMember && (
        <WalletCard member={member} />
      )}

      {householdId && (
        <>
          {error && (
            <div className="empty" style={{ color: 'var(--danger)' }}>{error}</div>
          )}

          {!data && loading ? (
            <div className="empty">{t('common.loading')}</div>
          ) : kpis && data ? (
            <>
              <StatRow kpis={kpis} goalsCount={data.goals.length} />

              <div className="grid grid-12" style={{ alignItems: 'start' }}>
                <div className="span-5">
                  <div className="card">
                    <div className="card-header">
                      <div>
                        <div className="card-title">
                          {t('dashboard.budgetRing.title', { month: monthName })}
                        </div>
                        <div className="card-sub">
                          {t('dashboard.budgetRing.subtitle', {
                            spent: formatMoney(kpis.monthSpent),
                            budget:
                              kpis.monthBudget > 0
                                ? formatMoney(kpis.monthBudget)
                                : '—',
                          })}
                        </div>
                      </div>
                    </div>

                    <BudgetRing data={data.categorySpend} />

                    {ringCategories.length > 0 && (
                      <div className="fl-dash-ring-legend">
                        {ringCategories.map((c) => {
                          const budget = Number(c.budget);
                          const spent = Number(c.spent);
                          const over = spent > budget;
                          const pct = budget > 0
                            ? Math.min(Math.round((spent / budget) * 100), 100)
                            : 0;
                          const color = c.category.color ?? '#25D366';
                          return (
                            <div key={c.category.id} className="fl-dash-ring-legend__row">
                              <div className="fl-dash-ring-legend__head">
                                <span
                                  className="fl-dash-ring-legend__dot"
                                  style={{ background: color }}
                                  aria-hidden
                                />
                                <span className="fl-dash-ring-legend__label">
                                  {c.category.icon ? `${c.category.icon} ` : ''}
                                  {c.category.label}
                                </span>
                                <span
                                  className="fl-dash-ring-legend__amt"
                                  style={over ? { color: 'var(--danger)' } : undefined}
                                >
                                  {t('dashboard.budgetRing.legendAmount', {
                                    used: formatMoney(spent),
                                    budget: formatMoney(budget),
                                  })}
                                </span>
                              </div>
                              <div className="fl-dash-ring-legend__bar">
                                <div
                                  className="fl-dash-ring-legend__fill"
                                  style={{
                                    width: pct + '%',
                                    background: over ? 'var(--danger)' : color,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="span-7">
                  <div className="card">
                    <div className="card-header">
                      <div>
                        <div className="card-title">{t('dashboard.bars.title')}</div>
                        <div className="card-sub">{t('dashboard.bars.subtitle')}</div>
                      </div>
                      <div className="fl-dash-card-actions">
                        <Link to="/expenses" className="btn btn-outlined btn-sm">
                          {t('dashboard.bars.openExpenses')}
                        </Link>
                      </div>
                    </div>
                    <SpendingBars data={data.categorySpend} />
                  </div>
                </div>

                <div className="span-12">
                  <div className="card">
                    <div className="card-header">
                      <div>
                        <div className="card-title">{t('dashboard.dailySpend.title')}</div>
                        <div className="card-sub">{t('dashboard.dailySpend.subtitle')}</div>
                      </div>
                    </div>
                    <DailySpendChart householdId={householdId} />
                  </div>
                </div>

                <div className="span-8">
                  <div className="card">
                    <div className="card-header">
                      <div>
                        <div className="card-title">{t('dashboard.goals.title')}</div>
                        <div className="card-sub">{t('dashboard.goals.subtitle')}</div>
                      </div>
                      <Link to="/goals" className="btn btn-outlined btn-sm">
                        {t('dashboard.goals.viewAll')}
                      </Link>
                    </div>
                    <GoalsStrip goals={data.goals} />
                  </div>
                </div>

                <div className="span-4">
                  <div className="card">
                    <div className="card-header">
                      <div>
                        <div className="card-title">{t('dashboard.activity.title')}</div>
                        <div className="card-sub">{t('dashboard.activity.subtitle')}</div>
                      </div>
                    </div>
                    <ActivityFeed
                      transactions={data.monthTransactions}
                      contributions={data.monthContributions}
                      debtPayments={data.monthDebtPayments}
                      goalsById={goalsById}
                      debtsById={debtsById}
                      membersById={membersById}
                      categoriesById={categoriesById}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </>
      )}
    </AppLayout>
  );
}

function firstName(full: string): string {
  return full.split(' ')[0] ?? full;
}
