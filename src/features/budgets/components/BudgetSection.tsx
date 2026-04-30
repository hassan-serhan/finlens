import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, AlertTriangle, Pencil, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { formatMoney } from '@/lib/format';
import { CategoryIcon, CATEGORY_ICONS, randomIconColor } from '@/lib/icons';
import { useHouseholdData } from '@/contexts/HouseholdDataContext';
import {
  addCategory,
  deleteCategory,
  getOrCreateCurrentMonthBudget,
  listCategories,
  listCategoryBudgets,
  setMonthlyTotal,
  upsertCategoryBudget,
} from '../api/budgetsApi';
import type { Category, CategoryBudget, MonthlyBudget } from '@/types/db';
import './BudgetSection.css';

type Props = { householdId: string; incomeTotal: number; refreshKey?: number };

export function BudgetSection({ householdId, incomeTotal, refreshKey }: Props) {
  const { t } = useTranslation();
  const { refreshCategories } = useHouseholdData();
  const [budget, setBudget] = useState<MonthlyBudget | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [catBudgets, setCatBudgets] = useState<CategoryBudget[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingTotal, setEditingTotal] = useState(false);
  const [draftTotal, setDraftTotal] = useState(0);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [draftCat, setDraftCat] = useState(0);
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    const b = await getOrCreateCurrentMonthBudget(householdId);
    const [cats, cbs] = await Promise.all([
      listCategories(householdId),
      listCategoryBudgets(b.id),
    ]);
    setBudget(b);
    setCategories(cats);
    setCatBudgets(cbs);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [householdId, refreshKey]);

  const allocated = useMemo(
    () => catBudgets.reduce((s, cb) => s + Number(cb.amount), 0),
    [catBudgets]
  );

  if (loading || !budget) {
    return (
      <div className="card" style={{ height: '100%' }}>
        <div className="card-header">
          <div>
            <div className="card-title">{t('income.budget.title')}</div>
            <div className="card-sub">{t('common.loading')}</div>
          </div>
        </div>
      </div>
    );
  }

  const incomeOk = budget.total <= incomeTotal;
  const incomePct = incomeTotal > 0 ? Math.min(Math.round((budget.total / incomeTotal) * 100), 100) : 0;

  const saveTotal = async () => {
    setBudget({ ...budget, total: draftTotal });
    setEditingTotal(false);
    await setMonthlyTotal(budget.id, draftTotal);
  };

  const saveCat = async (categoryId: string, amount: number) => {
    setEditingCat(null);
    setCatBudgets((prev) => {
      const found = prev.find((p) => p.category_id === categoryId);
      if (found) return prev.map((p) => (p.category_id === categoryId ? { ...p, amount } : p));
      return [
        ...prev,
        { id: 'tmp-' + categoryId, monthly_budget_id: budget.id, category_id: categoryId, amount },
      ];
    });
    await upsertCategoryBudget(budget.id, categoryId, amount);
  };

  const onAddCategory = async (input: { slug: string; label: string; icon: string; color: string }) => {
    const c = await addCategory(householdId, input);
    setCategories((prev) => [...prev, c]);
    setAdding(false);
    // Keep the global HouseholdDataContext in sync so AddExpenseCard picks it up immediately
    void refreshCategories();
  };

  const onDeleteCategory = async (id: string) => {
    await deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setCatBudgets((prev) => prev.filter((cb) => cb.category_id !== id));
    void refreshCategories();
  };

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header" style={{ flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <div className="card-title">{t('income.budget.title')}</div>
          <div className="card-sub">{t('income.budget.subtitle')}</div>
        </div>
        <span className={'chip ' + (incomeOk ? 'chip-primary' : 'chip-danger')}>
          {incomeOk
            ? <><Check size={12} strokeWidth={2.5} /> {t('income.budget.onTrack')}</>
            : <><AlertTriangle size={12} strokeWidth={2.5} /> {t('income.budget.overIncome')}</>
          }
        </span>
      </div>

      {/* Total */}
      <div className="bdg-total">
        <div className="tiny muted">{t('income.budget.monthlyTotal')}</div>
        <div className="row" style={{ justifyContent: 'space-between', marginTop: 4 }}>
          {editingTotal ? (
            <input
              type="number"
              value={draftTotal}
              onChange={(e) => setDraftTotal(parseFloat(e.target.value) || 0)}
              className="bdg-total__input"
              autoFocus
            />
          ) : (
            <div className="bdg-total__value">{formatMoney(budget.total)}</div>
          )}
          {editingTotal ? (
            <button className="btn btn-primary btn-sm" onClick={saveTotal}>
              {t('common.save')}
            </button>
          ) : (
            <button
              className="btn btn-outlined btn-sm"
              style={{ gap: 5, display: 'flex', alignItems: 'center' }}
              onClick={() => {
                setDraftTotal(budget.total);
                setEditingTotal(true);
              }}
            >
              <Pencil size={13} /> {t('common.edit')}
            </button>
          )}
        </div>
        <div className="bdg-total__bar">
          <div
            className="bdg-total__fill"
            style={{ width: incomePct + '%', background: incomeOk ? 'var(--primary)' : 'var(--danger)' }}
          />
        </div>
        <div className="bdg-total__legend">
          <span className="tiny muted">
            {t('income.budget.income')}: {formatMoney(incomeTotal)}
          </span>
          <span
            className="tiny bold"
            style={{ color: incomeOk ? 'var(--primary-900)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            {t('income.budget.budget')}: {formatMoney(budget.total)}{' '}
            {incomeOk ? <Check size={12} strokeWidth={2.5} /> : <AlertTriangle size={12} strokeWidth={2.5} />}
          </span>
        </div>
      </div>

      {/* Categories */}
      <div className="bdg-cats__head">
        <div className="bold small">{t('income.budget.categories')}</div>
        <div className="tiny muted">
          {t('income.budget.allocated')}: <b style={{ color: 'var(--neutral-900)' }}>{formatMoney(allocated)}</b>{' '}
          / {formatMoney(budget.total)}
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => setAdding(true)}>
          + {t('income.budget.addCategory')}
        </button>
      </div>

      <div className="bdg-cats">
        {categories.map((c) => {
          const cap = catBudgets.find((b) => b.category_id === c.id)?.amount ?? 0;
          const pct = cap > 0 ? Math.min((0 / cap) * 100, 100) : 0;
          const isEditing = editingCat === c.id;
          return (
            <div key={c.id} className="bdg-cat">
              <div className="row" style={{ justifyContent: 'space-between', gap: 10 }}>
                <div className="row" style={{ gap: 8, minWidth: 0 }}>
                  <span
                    className="bdg-cat__dot"
                    style={{ background: c.color ?? 'var(--primary)' }}
                  />
                  <span
                    style={{
                      color: c.color ?? 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <CategoryIcon icon={c.icon} size={16} />
                  </span>
                  <span className="bold" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                    {c.label}
                  </span>
                </div>
                <div className="row" style={{ gap: 4, flexShrink: 0 }}>
                  {isEditing ? (
                    <>
                      <input
                        type="number"
                        value={draftCat}
                        onChange={(e) => setDraftCat(parseFloat(e.target.value) || 0)}
                        className="bdg-cat__input"
                        autoFocus
                      />
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ padding: '4px 10px' }}
                        onClick={() => saveCat(c.id, draftCat)}
                      >
                        {t('common.save')}
                      </button>
                    </>
                  ) : (
                    <>
                      <span
                        className="bold tiny"
                        style={{ color: 'var(--neutral-700)', whiteSpace: 'nowrap' }}
                      >
                        {formatMoney(cap)}
                      </span>
                      <button
                        className="icon-btn"
                        style={{ width: 24, height: 24, boxShadow: 'none' }}
                        onClick={() => {
                          setDraftCat(cap);
                          setEditingCat(c.id);
                        }}
                        aria-label={t('common.edit')}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        className="icon-btn"
                        style={{ width: 24, height: 24, boxShadow: 'none' }}
                        onClick={() => onDeleteCategory(c.id)}
                        aria-label={t('common.delete')}
                      >
                        <X size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="bdg-cat__bar">
                <div
                  className="bdg-cat__fill"
                  style={{ width: pct + '%', background: c.color ?? 'var(--primary)' }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <AddCategoryModal open={adding} onClose={() => setAdding(false)} onAdd={onAddCategory} />
    </div>
  );
}

function AddCategoryModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (input: { slug: string; label: string; icon: string; color: string }) => void;
}) {
  const { t } = useTranslation();
  const [label, setLabel] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(CATEGORY_ICONS[0].name);
  const [color, setColor] = useState(() => randomIconColor());

  useEffect(() => {
    if (open) {
      setLabel('');
      setSelectedIcon(CATEGORY_ICONS[0].name);
      setColor(randomIconColor());
    }
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    onAdd({
      slug: label.trim().toLowerCase().replace(/\s+/g, '-'),
      label: label.trim(),
      icon: selectedIcon,
      color,
    });
  };

  return (
    <Modal open={open} title={t('income.budget.addCategoryTitle')} onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'grid', gap: 18 }}>
        <div className="field">
          <label htmlFor="cat-label">{t('income.budget.categoryName')}</label>
          <input
            id="cat-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            autoFocus
            required
          />
        </div>

        {/* Icon picker */}
        <div className="field">
          <label>{t('income.budget.icon')}</label>
          <div className="bdg-icon-picker">
            {CATEGORY_ICONS.map(({ name, Icon }) => (
              <button
                key={name}
                type="button"
                className={'bdg-icon-picker__btn' + (selectedIcon === name ? ' is-selected' : '')}
                style={selectedIcon === name ? { background: color + '22', borderColor: color, color } : {}}
                onClick={() => setSelectedIcon(name)}
                aria-label={name}
                aria-pressed={selectedIcon === name}
              >
                <Icon size={18} strokeWidth={2} />
              </button>
            ))}
          </div>
        </div>

        {/* Color preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: color + '22',
              color,
              display: 'grid',
              placeItems: 'center',
              border: `2px solid ${color}`,
              flexShrink: 0,
            }}
          >
            {(() => {
              const entry = CATEGORY_ICONS.find((e) => e.name === selectedIcon);
              return entry ? <entry.Icon size={18} strokeWidth={2} /> : null;
            })()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{label || t('income.budget.categoryName')}</div>
            <div style={{ fontSize: 11, color: 'var(--neutral-400)', marginTop: 2 }}>
              {t('income.budget.colorAuto')}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outlined btn-sm"
            onClick={() => setColor(randomIconColor())}
            style={{ flexShrink: 0 }}
          >
            {t('income.budget.shuffleColor')}
          </button>
        </div>

        <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="btn btn-outlined btn-sm" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn btn-primary btn-sm">
            {t('common.save')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
