import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatMoney, formatMoney2, formatDate } from '@/lib/format';
import { IncomePie } from './IncomePie';
import { AddIncomeModal, type AddIncomeForm } from './AddIncomeModal';
import type { IncomeSource } from '@/types/db';
import './IncomeSection.css';
import { Trash } from 'lucide-react';

type SourcesProps = {
  items: IncomeSource[];
  total: number;
  create: (input: AddIncomeForm) => Promise<void>;
  onChange?: () => void;
};

export function IncomeSourcesCard({ items, total, create, onChange }: SourcesProps) {
  const { t } = useTranslation();
  const [adding, setAdding] = useState(false);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">{t('income.income.sourcesTitle')}</div>
          <div className="card-sub">
            {items.length} {t('income.income.streams')} · {formatMoney(total)} {t('income.income.thisMonth')}
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setAdding(true)}>
          + {t('income.income.add')}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty">{t('income.income.empty')}</div>
      ) : (
        <>
          <IncomePie income={items} />
          <div style={{ marginTop: 18, display: 'grid', gap: 8 }}>
            {items.map((i) => (
              <div key={i.id} className="src-row">
                <span className="src-row__dot" style={{ background: i.color ?? '#25D366' }} />
                <div className="src-row__meta">
                  <div className="bold" style={{ fontSize: 13.5 }}>
                    {i.source}
                  </div>
                  <div className="tiny muted src-row__desc">{i.description ?? '—'}</div>
                </div>
                <div className="bold src-row__amt">+{formatMoney(Number(i.amount))}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <AddIncomeModal
        open={adding}
        onClose={() => setAdding(false)}
        onAdd={async (input) => {
          await create(input);
          setAdding(false);
          onChange?.();
        }}
      />
    </div>
  );
}

type LedgerProps = {
  items: IncomeSource[];
  remove: (i: IncomeSource) => Promise<void>;
  onChange?: () => void;
};

export function IncomeLedgerCard({ items, remove, onChange }: LedgerProps) {
  const { t } = useTranslation();

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">{t('income.income.ledgerTitle')}</div>
          <div className="card-sub">{t('income.income.ledgerSub')}</div>
        </div>
        <span className="chip chip-primary">🔒 {t('common.adminOnly')}</span>
      </div>

      {items.length === 0 ? (
        <div className="empty">{t('income.income.empty')}</div>
      ) : (
        <div className="ledger">
          {items.map((i, idx) => (
            <div
              key={i.id}
              className="ledger__row"
              style={{ borderBottom: idx < items.length - 1 ? '1px solid var(--neutral-100)' : 'none' }}
            >
              <div
                className="ledger__icon"
                style={{ background: (i.color ?? '#25D366') + '22', color: i.color ?? '#0E5C2C' }}
              >
                ↓
              </div>
              <div className="ledger__meta">
                <div className="bold" style={{ fontSize: 14 }}>
                  {i.source}
                </div>
                <div className="tiny muted">{i.description ?? '—'}</div>
              </div>
              <div className="ledger__amt-block">
                <div className="bold ledger__amt">+{formatMoney2(Number(i.amount))}</div>
                <div className="tiny muted">{formatDate(i.income_date)}</div>
              </div>
              <button
                className="icon-btn"
                onClick={async () => {
                  await remove(i);
                  onChange?.();
                }}
                aria-label={t('common.delete')}
                title={t('common.delete')}
              >
                <Trash size={14} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
