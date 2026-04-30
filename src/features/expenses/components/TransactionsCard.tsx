import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { firstOfMonthISO, formatDate, formatMoney2, todayISO } from '@/lib/format';
import { CategoryIcon } from '@/lib/icons';
import { useHouseholdData } from '@/contexts/HouseholdDataContext';
import { deleteExpense, listTransactions, type Transaction } from '../api/expensesApi';
import './TransactionsCard.css';

type Props = {
  householdId: string;
  refreshKey?: number;
  onChange?: () => void;
};

// Categories + members come from the shared HouseholdDataProvider — no extra
// fetches per page render. Only the date-range/member filter triggers a refetch.
export function TransactionsCard({ householdId, refreshKey, onChange }: Props) {
  const { t } = useTranslation();
  const { categoriesById, members } = useHouseholdData();
  const memberMap = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m])),
    [members]
  );

  const [from, setFrom] = useState(firstOfMonthISO());
  const [to, setTo] = useState(todayISO());
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const rows = await listTransactions({
          householdId,
          fromDate: from,
          toDate: to,
          memberId: memberFilter === 'all' ? null : memberFilter,
        });
        if (!cancelled) setTxns(rows);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [householdId, from, to, memberFilter, refreshKey]);

  const total = useMemo(() => txns.reduce((s, x) => s + Number(x.amount), 0), [txns]);

  return (
    <div className="card">
      <div className="card-header" style={{ flexWrap: 'wrap' }}>
        <div>
          <div className="card-title">{t('expenses.txns.title')}</div>
          <div className="card-sub">
            {txns.length} {t('expenses.txns.count')} · {formatMoney2(total)}{' '}
            {t('expenses.txns.spent')}
          </div>
        </div>

        <div className="txn-filters">
          <div className="txn-range">
            <label htmlFor="t-from">{t('expenses.txns.from')}</label>
            <input
              id="t-from"
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
            />
            <span className="muted">→</span>
            <label htmlFor="t-to">{t('expenses.txns.to')}</label>
            <input
              id="t-to"
              type="date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="tab-bar" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
        <button
          type="button"
          className={['tab-btn', memberFilter === 'all' ? 'active' : ''].join(' ')}
          onClick={() => setMemberFilter('all')}
        >
          {t('expenses.txns.all')}
        </button>
        {members.map((m) => (
          <button
            key={m.id}
            type="button"
            className={['tab-btn', memberFilter === m.id ? 'active' : ''].join(' ')}
            onClick={() => setMemberFilter(m.id)}
          >
            {m.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty">{t('common.loading')}</div>
      ) : txns.length === 0 ? (
        <div className="empty">{t('expenses.txns.empty')}</div>
      ) : (
        <div className="txn-list">
          {txns.map((x) => {
            const c = x.category_id ? categoriesById[x.category_id] : undefined;
            const m = x.member_id ? memberMap[x.member_id] : undefined;
            return (
              <div key={x.id} className="txn">
                <div
                  className="txn__icon"
                  style={{ background: ((c?.color ?? '#999') + '22') }}
                >
                  <span style={{ fontSize: 18, display: 'flex', alignItems: 'center' }}>
                    <CategoryIcon icon={c?.icon ?? null} size={18} />
                  </span>
                </div>
                <div className="txn__meta">
                  <div className="txn__desc">{x.description}</div>
                  <div className="txn__sub">
                    <span>{formatDate(x.txn_date)}</span>
                    {m && (
                      <>
                        <span>·</span>
                        <span className="row" style={{ gap: 4 }}>
                          <span className="avatar" style={{ width: 18, height: 18, fontSize: 10 }}>
                            {m.name.charAt(0).toUpperCase()}
                          </span>
                          {m.name}
                        </span>
                      </>
                    )}
                    {x.note && (
                      <>
                        <span>·</span>
                        <span>{x.note}</span>
                      </>
                    )}
                  </div>
                </div>
                {c && (
                  <span
                    className="chip"
                    style={{ background: (c.color ?? '#999') + '22', color: c.color ?? 'var(--neutral-700)' }}
                  >
                    {c.label}
                  </span>
                )}
                <div className="txn__amount">−{formatMoney2(Number(x.amount))}</div>
                <button
                  className="icon-btn"
                  aria-label={t('common.delete')}
                  title={t('common.delete')}
                  onClick={async () => {
                    await deleteExpense(x);
                    setTxns((prev) => prev.filter((p) => p.id !== x.id));
                    onChange?.();
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
