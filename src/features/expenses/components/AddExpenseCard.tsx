import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { todayISO } from '@/lib/format';
import { useHouseholdData } from '@/contexts/HouseholdDataContext';
import { isInsufficientFunds } from '@/lib/errors';
import { addExpense } from '../api/expensesApi';
import { CategoryIcon } from '@/lib/icons';
import type { Category, FamilyMember } from '@/types/db';
import './AddExpenseCard.css';

type Props = {
  householdId: string;
  member: FamilyMember;
  onAdded: () => void;
  onInsufficientFunds?: (available: number, requested: number) => void;
};

export function AddExpenseCard({ householdId, member, onAdded, onInsufficientFunds }: Props) {
  const { t } = useTranslation();
  const { categories } = useHouseholdData();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>('');
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Default to first category once they arrive
  useEffect(() => {
    if (!category && categories[0]) setCategory(categories[0].id);
  }, [categories, category]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const n = parseFloat(amount);
    if (!description.trim()) return setError(t('expenses.add.errors.desc'));
    if (Number.isNaN(n) || n <= 0) return setError(t('expenses.add.errors.amount'));
    if (!category) return setError(t('expenses.add.errors.category'));

    setBusy(true);
    try {
      await addExpense(householdId, {
        description: description.trim(),
        amount: n,
        category_id: category,
        txn_date: date,
        note: note.trim() || undefined,
        member,
      });
      setDescription('');
      setAmount('');
      setNote('');
      setDate(todayISO());
      onAdded();
    } catch (err) {
      if (isInsufficientFunds(err)) {
        onInsufficientFunds?.(err.available, err.requested);
        setError(null);
      } else {
        setError(err instanceof Error ? err.message : t('expenses.add.errors.generic'));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ background: 'var(--tertiary-cream)' }}>
      <div className="card-header">
        <div>
          <div className="card-title">{t('expenses.add.title')}</div>
          <div className="card-sub">{t('expenses.add.subtitle')}</div>
        </div>
      </div>

      <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="field">
            <label htmlFor="exp-desc">{t('expenses.add.description')}</label>
            <input
              id="exp-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('expenses.add.descriptionPh')}
              autoFocus
              required
            />
          </div>
          <div className="field">
            <label htmlFor="exp-amount">{t('expenses.add.amount')}</label>
            <input
              id="exp-amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="field">
            <label>{t('expenses.add.category')}</label>
            <CategorySelect
              categories={categories}
              value={category}
              onChange={setCategory}
            />
          </div>
          <div className="field">
            <label htmlFor="exp-date">{t('expenses.add.date')}</label>
            <input
              id="exp-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="exp-note">{t('expenses.add.note')}</label>
          <input
            id="exp-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('expenses.add.notePh')}
          />
        </div>

        {error && (
          <div role="alert" style={{ color: 'var(--danger)', fontSize: 13 }}>
            {error}
          </div>
        )}

        <div className="row" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            + {t('expenses.add.submit')}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Custom category picker (native <select> can't render SVG icons) ───────────

function CategorySelect({
  categories,
  value,
  onChange,
}: {
  categories: Category[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selected = categories.find((c) => c.id === value);
  const color = selected?.color ?? 'var(--primary)';

  return (
    <div ref={ref} className={`cat-sel${open ? ' cat-sel--open' : ''}`}>
      <button
        type="button"
        className="cat-sel__trigger"
        onClick={() => setOpen((o) => !o)}
      >
        {selected ? (
          <>
            <span
              className="cat-sel__badge"
              style={{ background: color + '22', color }}
            >
              <CategoryIcon icon={selected.icon} size={14} />
            </span>
            <span className="cat-sel__label">{selected.label}</span>
          </>
        ) : (
          <span className="cat-sel__label" style={{ color: 'var(--neutral-400)' }}>—</span>
        )}
        <ChevronDown size={14} className="cat-sel__chevron" />
      </button>

      {open && (
        <div className="cat-sel__list">
          {categories.map((c) => {
            const col = c.color ?? 'var(--primary)';
            const active = c.id === value;
            return (
              <button
                key={c.id}
                type="button"
                className={`cat-sel__option${active ? ' is-active' : ''}`}
                onClick={() => { onChange(c.id); setOpen(false); }}
              >
                <span
                  className="cat-sel__option__icon"
                  style={{ background: col + '22', color: col }}
                >
                  <CategoryIcon icon={c.icon} size={15} />
                </span>
                <span className="cat-sel__option__name">{c.label}</span>
                {active && (
                  <span
                    className="cat-sel__option__dot"
                    style={{ background: col }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
