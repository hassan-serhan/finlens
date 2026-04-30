import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatMoney } from '@/lib/format';
import { getCategorySpendForMonth, type CategorySpend } from '../api/expensesApi';
import { CategoryIcon } from '@/lib/icons';
import './MonthAtGlanceCard.css';

type Props = { householdId: string; refreshKey?: number };

// Calls a single RPC instead of three sequential queries.
// No client-side join with categories — the RPC already returns them.
export function MonthAtGlanceCard({ householdId, refreshKey }: Props) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<CategorySpend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const r = await getCategorySpendForMonth(householdId);
        if (!cancelled) setRows(r);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [householdId, refreshKey]);

  return (
    <div className="card" style={{ marginTop: 18 }}>
      <div className="card-header">
        <div>
          <div className="card-title">{t('expenses.glance.title')}</div>
          <div className="card-sub">{t('expenses.glance.subtitle')}</div>
        </div>
      </div>

      {loading ? (
        <div className="empty">{t('common.loading')}</div>
      ) : rows.length === 0 ? (
        <div className="empty">{t('expenses.glance.empty')}</div>
      ) : (
        <div className="glance">
          {rows.map(({ category: c, budget, spent }) => {
            const pct = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 200) : 0;
            const over = budget > 0 && spent > budget;
            return (
              <div key={c.id} className="glance__cell">
                <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <span
                      style={{
                        color: c.color ?? 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <CategoryIcon icon={c.icon} size={18} />
                    </span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{c.label}</span>
                  </div>
                  {over && <span className="chip chip-danger">{t('expenses.glance.over')}</span>}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>
                  {formatMoney(spent)}
                  <span className="muted small" style={{ fontWeight: 500 }}>
                    {' / '}
                    {budget > 0 ? formatMoney(budget) : t('expenses.glance.noBudget')}
                  </span>
                </div>
                <div className="glance__bar">
                  <div
                    className="glance__fill"
                    style={{
                      width: Math.min(pct, 100) + '%',
                      background: over ? 'var(--danger)' : (c.color ?? 'var(--primary)'),
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
