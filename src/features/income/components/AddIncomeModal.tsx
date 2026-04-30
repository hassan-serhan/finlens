import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { todayISO } from '@/lib/format';

export type AddIncomeForm = {
  source: string;
  description: string;
  amount: number;
  income_date: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (input: AddIncomeForm) => Promise<void> | void;
};

export function AddIncomeModal({ open, onClose, onAdd }: Props) {
  const { t } = useTranslation();
  const [source, setSource] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setSource('');
      setDescription('');
      setAmount('');
      setDate(todayISO());
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!source.trim() || Number.isNaN(n) || n <= 0) return;
    setBusy(true);
    try {
      await onAdd({
        source: source.trim(),
        description: description.trim(),
        amount: n,
        income_date: date,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title={t('income.income.addTitle')}
      subtitle={t('income.income.addSubtitle')}
      onClose={onClose}
    >
      <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
        <div className="field">
          <label htmlFor="src">{t('income.income.source')}</label>
          <input
            id="src"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder={t('income.income.sourcePh')}
            autoFocus
            required
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label htmlFor="amt">{t('income.income.amount')}</label>
            <input
              id="amt"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="dte">{t('income.income.date')}</label>
            <input
              id="dte"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="desc">{t('income.income.description')}</label>
          <input
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="row" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button type="button" className="btn btn-outlined btn-sm" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
            + {t('income.income.add')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
