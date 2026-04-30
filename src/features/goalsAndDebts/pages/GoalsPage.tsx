import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Modal } from '@/components/ui/Modal';
import { CreditCard, PiggyBank, Shield, TrendingUp, ArrowDownLeft, ArrowUpRight, Trash } from 'lucide-react';
import { useHousehold } from '@/features/household/hooks/useHousehold';
import { useHouseholdData } from '@/contexts/HouseholdDataContext';
import { listAccounts, getAccountByKind } from '@/features/accounts/api/accountsApi';
import { getOrCreateWallet } from '@/features/wallet/api/walletApi';
import { WalletCard } from '@/features/wallet/components/WalletCard';
import { InsufficientFundsModal } from '@/features/wallet/components/InsufficientFundsModal';
import { isInsufficientFunds } from '@/lib/errors';
import { formatMoney, formatMoney2, formatDate, todayISO } from '@/lib/format';
import { useGoalsAndDebts, type ContributionActivity } from '../hooks/useGoalsAndDebts';
import {
  addGoal,
  contributeToGoal,
  deleteGoal,
  listGoalContributions,
  type AddGoalInput,
} from '../api/goalsApi';
import {
  addDebt,
  deleteDebt,
  listDebtPayments,
  payDebt,
  type AddDebtInput,
} from '../api/debtsApi';
import type {
  Account,
  Debt,
  DebtPayment,
  FamilyMember,
  GoalContribution,
  Priority,
  SavingsGoal,
} from '@/types/db';
import '../components/GoalsAndDebts.css';

type WarnState = { available: number; requested: number } | null;

export function GoalsPage() {
  const { t } = useTranslation();
  const { householdId, member, loading, error } = useHousehold();

  return (
    <AppLayout>
      <header style={{ marginBlockEnd: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
          {t('goals.title')}
        </h1>
        <p style={{ color: 'var(--neutral-500)', margin: '4px 0 0', fontSize: 13.5 }}>
          {t('goals.subtitle')}
        </p>
      </header>

      {loading && <div className="empty">{t('common.loading')}</div>}
      {error && <div className="empty" style={{ color: 'var(--danger)' }}>{error}</div>}

      {householdId && member && <GoalsBody householdId={householdId} member={member} />}
    </AppLayout>
  );
}

function GoalsBody({ householdId, member }: { householdId: string; member: FamilyMember }) {
  const { t } = useTranslation();
  const { membersById } = useHouseholdData();
  const { goals, debts, monthActivity, monthTotal, loading, reload } = useGoalsAndDebts(householdId);
  const [tab, setTab] = useState<'savings' | 'debts'>('savings');
  const [mainBalance, setMainBalance] = useState<number | null>(null);
  const [version, setVersion] = useState(0);

  const isMember = member.role === 'Member';

  const [contributingTo, setContributingTo] = useState<SavingsGoal | null>(null);
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);
  const [historyGoal, setHistoryGoal] = useState<SavingsGoal | null>(null);
  const [historyDebt, setHistoryDebt] = useState<Debt | null>(null);
  const [adding, setAdding] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [warn, setWarn] = useState<WarnState>(null);

  // Main account balance for the first tile.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const accounts = await listAccounts(householdId);
      if (cancelled) return;
      const main = accounts.find((a: Account) => a.kind === 'main');
      setMainBalance(main ? Number(main.balance) : 0);
    })();
    return () => { cancelled = true; };
  }, [householdId, version]);

  const totalSaved = goals.reduce((s, g) => s + Number(g.saved), 0);
  const totalGoalTarget = goals.reduce((s, g) => s + Number(g.target), 0);
  const debtRemaining = debts.reduce((s, d) => s + Math.max(Number(d.total) - Number(d.paid), 0), 0);
  const debtTotal = debts.reduce((s, d) => s + Number(d.total), 0);
  const debtPaid = debts.reduce((s, d) => s + Number(d.paid), 0);

  const goalsPct = totalGoalTarget > 0 ? Math.round((totalSaved / totalGoalTarget) * 100) : 0;
  const debtPct = debtTotal > 0 ? Math.round((debtPaid / debtTotal) * 100) : 0;

  const afterAction = async () => {
    setVersion((v) => v + 1);
    await reload();
  };

  // Pre-flight balance check for the actor's source-of-funds.
  const preflight = async (amount: number): Promise<WarnState | null> => {
    if (member.role === 'Admin') {
      const main = await getAccountByKind(householdId, 'main');
      const available = main ? Number(main.balance) : 0;
      if (amount > available) return { available, requested: amount };
    } else {
      const wallet = await getOrCreateWallet(member);
      const available = Number(wallet.balance);
      if (amount > available) return { available, requested: amount };
    }
    return null;
  };

  return (
    <>
      {isMember && <WalletCard member={member} refreshKey={version} />}

      <div className="gd-tiles">
        <div className="card gd-tile gd-tile--dark">
          <div className="gd-tile__head">
            <div>
              <div className="gd-tile__label" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {t('goals.tiles.mainBalance')}
              </div>
              <div className="gd-tile__value">
                {mainBalance == null ? '—' : formatMoney2(mainBalance)}
              </div>
            </div>
            <div className="gd-tile__icon"><CreditCard size={20} strokeWidth={2} /></div>
          </div>
          <div className="gd-tile__hint">{t('goals.tiles.mainHint')}</div>
        </div>

        <div className="card gd-tile gd-tile--tint">
          <div className="gd-tile__head">
            <div>
              <div className="gd-tile__label" style={{ color: 'var(--primary-900)' }}>
                {t('goals.tiles.totalSaved')}
              </div>
              <div className="gd-tile__value">{formatMoney(totalSaved)}</div>
            </div>
            <div className="gd-tile__icon" style={{ background: '#fff' }}><PiggyBank size={20} strokeWidth={2} /></div>
          </div>
          <div className="gd-tile__bar">
            <div className="gd-tile__fill" style={{ width: goalsPct + '%' }} />
          </div>
          <div className="gd-tile__hint" style={{ color: 'var(--primary-900)', fontWeight: 600 }}>
            {t('goals.tiles.savedToward', { pct: goalsPct, target: formatMoney(totalGoalTarget) })}
          </div>
        </div>

        <div className="card gd-tile gd-tile--warm">
          <div className="gd-tile__head">
            <div>
              <div className="gd-tile__label" style={{ color: '#7A4A0E' }}>
                {t('goals.tiles.debtRemaining')}
              </div>
              <div className="gd-tile__value">{formatMoney(debtRemaining)}</div>
            </div>
            <div className="gd-tile__icon" style={{ background: '#fff' }}><Shield size={20} strokeWidth={2} /></div>
          </div>
          <div className="gd-tile__bar" style={{ background: 'rgba(184, 88, 11, 0.18)' }}>
            <div className="gd-tile__fill" style={{ width: debtPct + '%', background: '#B8580B' }} />
          </div>
          <div className="gd-tile__hint" style={{ color: '#7A4A0E', fontWeight: 600 }}>
            {t('goals.tiles.debtPaid', { pct: debtPct })}
          </div>
        </div>

        <div className="card gd-tile">
          <div className="gd-tile__head">
            <div>
              <div className="gd-tile__label" style={{ color: 'var(--neutral-500)' }}>
                {t('goals.tiles.thisMonth')}
              </div>
              <div className="gd-tile__value">{formatMoney(monthTotal)}</div>
            </div>
            <div className="gd-tile__icon"><TrendingUp size={20} strokeWidth={2} /></div>
          </div>
          <div className="gd-tile__hint">
            {t('goals.tiles.thisMonthCount', { count: monthActivity.length })}
          </div>
          <button
            className="btn btn-outlined btn-sm"
            style={{ alignSelf: 'flex-start', marginTop: 'auto' }}
            onClick={() => setActivityOpen(true)}
            disabled={monthActivity.length === 0}
          >
            {t('goals.tiles.seeAll')}
          </button>
        </div>
      </div>

      {/* Tabs + add */}
      <div className="row" style={{ justifyContent: 'space-between', marginBlockEnd: 12 }}>
        <div className="gd-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'savings'}
            className={'gd-tabs__btn ' + (tab === 'savings' ? 'is-active' : '')}
            onClick={() => setTab('savings')}
          >
            {t('goals.tabs.savings', { count: goals.length })}
          </button>
          <button
            role="tab"
            aria-selected={tab === 'debts'}
            className={'gd-tabs__btn ' + (tab === 'debts' ? 'is-active' : '')}
            onClick={() => setTab('debts')}
          >
            {t('goals.tabs.debts', { count: debts.length })}
          </button>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setAdding(true)}>
          + {tab === 'savings' ? t('goals.actions.newGoal') : t('goals.actions.newDebt')}
        </button>
      </div>

      {/* Cards */}
      {loading && goals.length === 0 && debts.length === 0 ? (
        <div className="empty">{t('common.loading')}</div>
      ) : tab === 'savings' ? (
        <GoalsList
          goals={goals}
          onContribute={setContributingTo}
          onHistory={setHistoryGoal}
          onDelete={async (g) => {
            await deleteGoal(g.id);
            await afterAction();
          }}
        />
      ) : (
        <DebtsList
          debts={debts}
          onPay={setPayingDebt}
          onHistory={setHistoryDebt}
          onDelete={async (d) => {
            await deleteDebt(d.id);
            await afterAction();
          }}
        />
      )}

      <ContributeModal
        goal={contributingTo}
        member={member}
        preflight={preflight}
        onWarn={(w) => { setContributingTo(null); setWarn(w); }}
        onClose={() => setContributingTo(null)}
        onSaved={async () => { setContributingTo(null); await afterAction(); }}
      />

      <PayDebtModal
        debt={payingDebt}
        member={member}
        preflight={preflight}
        onWarn={(w) => { setPayingDebt(null); setWarn(w); }}
        onClose={() => setPayingDebt(null)}
        onSaved={async () => { setPayingDebt(null); await afterAction(); }}
      />

      <GoalHistoryModal
        goal={historyGoal}
        membersById={membersById}
        onClose={() => setHistoryGoal(null)}
      />

      <DebtHistoryModal
        debt={historyDebt}
        membersById={membersById}
        onClose={() => setHistoryDebt(null)}
      />

      {tab === 'savings' ? (
        <AddGoalModal
          open={adding}
          onClose={() => setAdding(false)}
          onSaved={async (input) => {
            await addGoal(householdId, input);
            setAdding(false);
            await afterAction();
          }}
        />
      ) : (
        <AddDebtModal
          open={adding}
          onClose={() => setAdding(false)}
          onSaved={async (input) => {
            await addDebt(householdId, input);
            setAdding(false);
            await afterAction();
          }}
        />
      )}

      <ActivityModal
        open={activityOpen}
        activity={monthActivity}
        membersById={membersById}
        onClose={() => setActivityOpen(false)}
      />

      <InsufficientFundsModal
        open={!!warn}
        onClose={() => setWarn(null)}
        source={isMember ? 'wallet' : 'main'}
        available={warn?.available ?? 0}
        requested={warn?.requested ?? 0}
      />
    </>
  );
}

/* --------------------------- lists --------------------------- */

function GoalsList({
  goals,
  onContribute,
  onHistory,
  onDelete,
}: {
  goals: SavingsGoal[];
  onContribute: (g: SavingsGoal) => void;
  onHistory: (g: SavingsGoal) => void;
  onDelete: (g: SavingsGoal) => Promise<void>;
}) {
  const { t } = useTranslation();
  if (goals.length === 0) return <div className="gd-empty">{t('goals.empty.goals')}</div>;
  return (
    <div className="gd-grid">
      {goals.map((g) => (
        <GoalCard
          key={g.id}
          goal={g}
          onContribute={() => onContribute(g)}
          onHistory={() => onHistory(g)}
          onDelete={() => void onDelete(g)}
        />
      ))}
    </div>
  );
}

function GoalCard({
  goal,
  onContribute,
  onHistory,
  onDelete,
}: {
  goal: SavingsGoal;
  onContribute: () => void;
  onHistory: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const saved = Number(goal.saved);
  const target = Number(goal.target);
  const remaining = Math.max(target - saved, 0);
  const pct = target > 0 ? Math.min(Math.round((saved / target) * 100), 100) : 0;
  const monthlyPace = remaining > 0 ? Math.ceil(remaining / 4) : 0;
  const isDark = goal.priority === 'high';

  return (
    <div className={'card gd-card gd-card--prio-' + goal.priority}>
      <div className="gd-card__head">
        <div className="gd-card__brand">
          <div className="gd-card__icon">{goal.icon ?? '🎯'}</div>
          <div style={{ minWidth: 0 }}>
            <div className="gd-card__name">{goal.name}</div>
            <div className="gd-card__sub">
              {goal.due_date ? `📅 ${t('goals.card.target')}: ${formatDate(goal.due_date)}` : t('goals.card.noDue')}
            </div>
          </div>
        </div>
        <span className={'gd-prio-chip gd-prio-chip--' + goal.priority}>
          {t('goals.priority.' + goal.priority)}
        </span>
      </div>

      <div>
        <div className="gd-card__amount">
          {formatMoney(saved)}{' '}
          <span className="gd-card__amount-sub">{t('goals.card.of', { value: formatMoney(target) })}</span>
        </div>
        <div className="gd-card__bar" style={{ marginTop: 6 }}>
          <div className="gd-card__fill" style={{ width: pct + '%' }} />
        </div>
      </div>

      <div className="gd-card__stats">
        <div>
          <div className="gd-card__stat-label">{t('goals.card.remaining')}</div>
          <div className="gd-card__stat-value">{formatMoney(remaining)}</div>
        </div>
        <div>
          <div className="gd-card__stat-label">{t('goals.card.monthlyPace')}</div>
          <div className="gd-card__stat-value">{formatMoney(monthlyPace)}/mo</div>
        </div>
        <div>
          <div className="gd-card__stat-label">{t('goals.card.progress')}</div>
          <div className="gd-card__stat-value">{pct}%</div>
        </div>
      </div>

      <div className="gd-card__footer">
        <button
          className={'btn btn-sm ' + (isDark ? 'btn-inverted-outline' : 'btn-outlined')}
          onClick={onHistory}
        >
          {t('goals.card.seeHistory')}
        </button>
        <div className="gd-card__actions">
          <button
            className="icon-btn"
            onClick={onDelete}
            aria-label={t('common.delete')}
            title={t('common.delete')}
           
          >
            <Trash size={14} strokeWidth={2} />
          </button>
          <button className="btn btn-primary btn-sm" onClick={onContribute}>
            + {t('goals.card.contribute')}
          </button>
        </div>
      </div>
    </div>
  );
}

function DebtsList({
  debts,
  onPay,
  onHistory,
  onDelete,
}: {
  debts: Debt[];
  onPay: (d: Debt) => void;
  onHistory: (d: Debt) => void;
  onDelete: (d: Debt) => Promise<void>;
}) {
  const { t } = useTranslation();
  if (debts.length === 0) return <div className="gd-empty">{t('goals.empty.debts')}</div>;
  return (
    <div className="gd-grid">
      {debts.map((d) => (
        <DebtCard
          key={d.id}
          debt={d}
          onPay={() => onPay(d)}
          onHistory={() => onHistory(d)}
          onDelete={() => void onDelete(d)}
        />
      ))}
    </div>
  );
}

function DebtCard({
  debt,
  onPay,
  onHistory,
  onDelete,
}: {
  debt: Debt;
  onPay: () => void;
  onHistory: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const total = Number(debt.total);
  const paid = Number(debt.paid);
  const remaining = Math.max(total - paid, 0);
  const pct = total > 0 ? Math.min(Math.round((paid / total) * 100), 100) : 0;
  const isDark = debt.priority === 'high';

  return (
    <div className={'card gd-card gd-card--prio-' + debt.priority}>
      <div className="gd-card__head">
        <div className="gd-card__brand">
          <div className="gd-card__icon" style={{ background: '#FFE9D6', color: '#B8580B' }}>
            {debt.icon ?? '💳'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="gd-card__name">{debt.name}</div>
            <div className="gd-card__sub">
              {debt.interest_rate != null ? `${debt.interest_rate}% APR` : ''}
              {debt.monthly_payment != null
                ? ` · ${formatMoney(Number(debt.monthly_payment))}/mo`
                : ''}
            </div>
          </div>
        </div>
        <span className={'gd-prio-chip gd-prio-chip--' + debt.priority}>
          {t('goals.priority.' + debt.priority)}
        </span>
      </div>

      <div>
        <div className="gd-card__amount">{formatMoney(remaining)}</div>
        <div className="gd-card__sub" style={{ marginBottom: 8 }}>
          {t('goals.card.remainingOf', { value: formatMoney(total) })}
        </div>
        <div className="gd-card__bar">
          <div
            className="gd-card__fill"
            style={{ width: pct + '%', background: '#B8580B' }}
          />
        </div>
      </div>

      <div className="gd-card__stats">
        <div>
          <div className="gd-card__stat-label">{t('goals.card.paid')}</div>
          <div className="gd-card__stat-value">{formatMoney(paid)}</div>
        </div>
        <div>
          <div className="gd-card__stat-label">{t('goals.card.payoff')}</div>
          <div className="gd-card__stat-value">
            {debt.payoff_date ? formatDate(debt.payoff_date) : '—'}
          </div>
        </div>
        <div>
          <div className="gd-card__stat-label">{t('goals.card.progress')}</div>
          <div className="gd-card__stat-value">{pct}%</div>
        </div>
      </div>

      <div className="gd-card__footer">
        <button
          className={'btn btn-sm ' + (isDark ? 'btn-inverted-outline' : 'btn-outlined')}
          onClick={onHistory}
        >
          {t('goals.card.seeHistory')}
        </button>
        <div className="gd-card__actions">
          <button
            className="icon-btn"
            onClick={onDelete}
            aria-label={t('common.delete')}

          >
            <Trash size={14} strokeWidth={2} />
          </button>
          <button className="btn btn-primary btn-sm" onClick={onPay}>
            + {t('goals.card.pay')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- modals --------------------------- */

function PriorityPicker({
  value,
  onChange,
}: {
  value: Priority;
  onChange: (p: Priority) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="gd-priority-picker">
      {(['high', 'medium', 'low'] as Priority[]).map((p) => (
        <button
          key={p}
          type="button"
          className={'gd-priority-picker__btn ' + (value === p ? 'is-active' : '')}
          onClick={() => onChange(p)}
        >
          {t('goals.priority.' + p)}
        </button>
      ))}
    </div>
  );
}

function ContributeModal({
  goal,
  member,
  preflight,
  onWarn,
  onClose,
  onSaved,
}: {
  goal: SavingsGoal | null;
  member: FamilyMember;
  preflight: (amount: number) => Promise<WarnState | null>;
  onWarn: (w: WarnState) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (goal) { setAmount(''); setDate(todayISO()); setErr(null); }
  }, [goal]);

  if (!goal) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(amount);
    if (Number.isNaN(n) || n <= 0) { setErr(t('goals.errors.amount')); return; }
    setBusy(true);
    setErr(null);
    try {
      const warn = await preflight(n);
      if (warn) { onWarn(warn); return; }
      await contributeToGoal({ goal, amount: n, member, contributedAt: date });
      onSaved();
    } catch (e2) {
      if (isInsufficientFunds(e2)) {
        onWarn({ available: e2.available, requested: e2.requested });
      } else {
        setErr(e2 instanceof Error ? e2.message : t('goals.errors.generic'));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={!!goal}
      title={t('goals.contribute.title', { name: goal.name })}
      subtitle={t('goals.contribute.subtitle', {
        saved: formatMoney(Number(goal.saved)),
        target: formatMoney(Number(goal.target)),
      })}
      onClose={onClose}
    >
      <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
        <div className="field">
          <label htmlFor="ct-amt">{t('goals.contribute.amount')}</label>
          <input
            id="ct-amt"
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
            required
          />
        </div>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {[25, 50, 100, 250].map((n) => (
            <button
              key={n}
              type="button"
              className="chip chip-primary"
              style={{ cursor: 'pointer' }}
              onClick={() => setAmount(String(n))}
            >
              +{formatMoney(n)}
            </button>
          ))}
        </div>
        <div className="field">
          <label htmlFor="ct-date">{t('goals.contribute.date')}</label>
          <input
            id="ct-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        {err && <div className="empty" style={{ color: 'var(--danger)' }}>{err}</div>}
        <div className="row" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button type="button" className="btn btn-outlined btn-sm" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
            ✓ {t('goals.contribute.submit')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function PayDebtModal({
  debt,
  member,
  preflight,
  onWarn,
  onClose,
  onSaved,
}: {
  debt: Debt | null;
  member: FamilyMember;
  preflight: (amount: number) => Promise<WarnState | null>;
  onWarn: (w: WarnState) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (debt) {
      setAmount(debt.monthly_payment != null ? String(debt.monthly_payment) : '');
      setDate(todayISO());
      setErr(null);
    }
  }, [debt]);

  if (!debt) return null;
  const remaining = Math.max(Number(debt.total) - Number(debt.paid), 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(amount);
    if (Number.isNaN(n) || n <= 0) { setErr(t('goals.errors.amount')); return; }
    setBusy(true);
    setErr(null);
    try {
      const warn = await preflight(n);
      if (warn) { onWarn(warn); return; }
      await payDebt({ debt, amount: n, member, paidAt: date });
      onSaved();
    } catch (e2) {
      if (isInsufficientFunds(e2)) {
        onWarn({ available: e2.available, requested: e2.requested });
      } else {
        setErr(e2 instanceof Error ? e2.message : t('goals.errors.generic'));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={!!debt}
      title={t('goals.pay.title', { name: debt.name })}
      subtitle={t('goals.pay.subtitle', { value: formatMoney(remaining) })}
      onClose={onClose}
    >
      <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
        <div className="field">
          <label htmlFor="pd-amt">{t('goals.pay.amount')}</label>
          <input
            id="pd-amt"
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
            required
          />
        </div>
        <div className="field">
          <label htmlFor="pd-date">{t('goals.pay.date')}</label>
          <input
            id="pd-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        {err && <div className="empty" style={{ color: 'var(--danger)' }}>{err}</div>}
        <div className="row" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button type="button" className="btn btn-outlined btn-sm" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
            ✓ {t('goals.pay.submit')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AddGoalModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (input: AddGoalInput) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [priority, setPriority] = useState<Priority>('medium');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(''); setTarget(''); setDueDate(''); setIcon('🎯'); setPriority('medium'); setErr(null);
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(target);
    if (!name.trim()) { setErr(t('goals.errors.name')); return; }
    if (Number.isNaN(n) || n <= 0) { setErr(t('goals.errors.target')); return; }
    setBusy(true);
    setErr(null);
    try {
      await onSaved({
        name: name.trim(),
        target: n,
        due_date: dueDate || null,
        icon,
        priority,
      });
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : t('goals.errors.generic'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title={t('goals.add.goalTitle')} onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
        <div className="field">
          <label htmlFor="g-name">{t('goals.add.name')}</label>
          <input id="g-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label htmlFor="g-target">{t('goals.add.target')}</label>
            <input
              id="g-target"
              type="number"
              min="1"
              step="0.01"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="g-due">{t('goals.add.dueDate')}</label>
            <input id="g-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="g-icon">{t('goals.add.icon')}</label>
          <input id="g-icon" maxLength={3} value={icon} onChange={(e) => setIcon(e.target.value)} />
        </div>
        <div className="field">
          <label>{t('goals.add.priority')}</label>
          <PriorityPicker value={priority} onChange={setPriority} />
        </div>
        {err && <div className="empty" style={{ color: 'var(--danger)' }}>{err}</div>}
        <div className="row" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button type="button" className="btn btn-outlined btn-sm" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
            {t('common.save')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AddDebtModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (input: AddDebtInput) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [total, setTotal] = useState('');
  const [monthly, setMonthly] = useState('');
  const [rate, setRate] = useState('');
  const [payoff, setPayoff] = useState('');
  const [icon, setIcon] = useState('💳');
  const [priority, setPriority] = useState<Priority>('medium');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(''); setTotal(''); setMonthly(''); setRate(''); setPayoff('');
      setIcon('💳'); setPriority('medium'); setErr(null);
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tot = parseFloat(total);
    if (!name.trim()) { setErr(t('goals.errors.name')); return; }
    if (Number.isNaN(tot) || tot <= 0) { setErr(t('goals.errors.target')); return; }
    setBusy(true);
    setErr(null);
    try {
      await onSaved({
        name: name.trim(),
        total: tot,
        monthly_payment: monthly ? parseFloat(monthly) : null,
        interest_rate: rate ? parseFloat(rate) : null,
        payoff_date: payoff || null,
        icon,
        priority,
      });
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : t('goals.errors.generic'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title={t('goals.add.debtTitle')} onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
        <div className="field">
          <label htmlFor="d-name">{t('goals.add.name')}</label>
          <input id="d-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label htmlFor="d-total">{t('goals.add.totalOwed')}</label>
            <input
              id="d-total"
              type="number"
              min="1"
              step="0.01"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="d-monthly">{t('goals.add.monthlyPay')}</label>
            <input
              id="d-monthly"
              type="number"
              min="0"
              step="0.01"
              value={monthly}
              onChange={(e) => setMonthly(e.target.value)}
            />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label htmlFor="d-rate">{t('goals.add.apr')}</label>
            <input
              id="d-rate"
              type="number"
              min="0"
              step="0.01"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="d-payoff">{t('goals.add.payoffDate')}</label>
            <input
              id="d-payoff"
              type="date"
              value={payoff}
              onChange={(e) => setPayoff(e.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="d-icon">{t('goals.add.icon')}</label>
          <input id="d-icon" maxLength={3} value={icon} onChange={(e) => setIcon(e.target.value)} />
        </div>
        <div className="field">
          <label>{t('goals.add.priority')}</label>
          <PriorityPicker value={priority} onChange={setPriority} />
        </div>
        {err && <div className="empty" style={{ color: 'var(--danger)' }}>{err}</div>}
        <div className="row" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button type="button" className="btn btn-outlined btn-sm" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
            {t('common.save')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function GoalHistoryModal({
  goal,
  membersById,
  onClose,
}: {
  goal: SavingsGoal | null;
  membersById: Record<string, FamilyMember>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [items, setItems] = useState<GoalContribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!goal) return;
    setLoading(true);
    void listGoalContributions(goal.id).then((rows) => {
      if (!cancelled) { setItems(rows); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [goal]);

  if (!goal) return null;

  return (
    <Modal
      open={!!goal}
      title={t('goals.history.goalTitle', { name: goal.name })}
      subtitle={t('goals.history.subtitle', { count: items.length })}
      onClose={onClose}
    >
      {loading ? (
        <div className="empty">{t('common.loading')}</div>
      ) : items.length === 0 ? (
        <div className="gd-empty">{t('goals.history.empty')}</div>
      ) : (
        <div className="gd-activity">
          {items.map((c) => (
            <div key={c.id} className="gd-activity__row">
              <div className="gd-activity__icon"><ArrowDownLeft size={14} strokeWidth={2.5} /></div>
              <div>
                <div className="gd-activity__name">
                  {c.member_id ? (membersById[c.member_id]?.name ?? t('goals.history.someone')) : t('goals.history.someone')}
                </div>
                <div className="gd-activity__meta">{formatDate(c.contributed_at)}</div>
              </div>
              <div className="gd-activity__amount" style={{ color: 'var(--primary-900)' }}>
                +{formatMoney2(Number(c.amount))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

function DebtHistoryModal({
  debt,
  membersById,
  onClose,
}: {
  debt: Debt | null;
  membersById: Record<string, FamilyMember>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [items, setItems] = useState<DebtPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!debt) return;
    setLoading(true);
    void listDebtPayments(debt.id).then((rows) => {
      if (!cancelled) { setItems(rows); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [debt]);

  if (!debt) return null;

  return (
    <Modal
      open={!!debt}
      title={t('goals.history.debtTitle', { name: debt.name })}
      subtitle={t('goals.history.subtitle', { count: items.length })}
      onClose={onClose}
    >
      {loading ? (
        <div className="empty">{t('common.loading')}</div>
      ) : items.length === 0 ? (
        <div className="gd-empty">{t('goals.history.empty')}</div>
      ) : (
        <div className="gd-activity">
          {items.map((p) => (
            <div key={p.id} className="gd-activity__row">
              <div className="gd-activity__icon gd-activity__icon--debt"><ArrowUpRight size={14} strokeWidth={2.5} /></div>
              <div>
                <div className="gd-activity__name">
                  {p.member_id ? (membersById[p.member_id]?.name ?? t('goals.history.someone')) : t('goals.history.someone')}
                </div>
                <div className="gd-activity__meta">{formatDate(p.paid_at)}</div>
              </div>
              <div className="gd-activity__amount" style={{ color: '#B8580B' }}>
                −{formatMoney2(Number(p.amount))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

function ActivityModal({
  open,
  activity,
  membersById,
  onClose,
}: {
  open: boolean;
  activity: ContributionActivity[];
  membersById: Record<string, FamilyMember>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const total = useMemo(
    () => activity.reduce((s, a) => s + Number(a.entry.amount), 0),
    [activity]
  );

  return (
    <Modal
      open={open}
      title={t('goals.activity.title')}
      subtitle={t('goals.activity.subtitle', {
        count: activity.length,
        total: formatMoney(total),
      })}
      onClose={onClose}
    >
      {activity.length === 0 ? (
        <div className="gd-empty">{t('goals.activity.empty')}</div>
      ) : (
        <div className="gd-activity">
          {activity.map((a) => {
            const member = a.entry.member_id ? membersById[a.entry.member_id] : null;
            const memberName = member?.name ?? t('goals.history.someone');
            if (a.kind === 'goal') {
              return (
                <div key={a.entry.id} className="gd-activity__row">
                  <div className="gd-activity__icon"><ArrowDownLeft size={14} strokeWidth={2.5} /></div>
                  <div>
                    <div className="gd-activity__name">{memberName}</div>
                    <div className="gd-activity__meta">
                      {a.goal.name} · {formatDate(a.entry.contributed_at)}
                    </div>
                  </div>
                  <div className="gd-activity__amount" style={{ color: 'var(--primary-900)' }}>
                    +{formatMoney2(Number(a.entry.amount))}
                  </div>
                </div>
              );
            }
            return (
              <div key={a.entry.id} className="gd-activity__row">
                <div className="gd-activity__icon gd-activity__icon--debt"><ArrowUpRight size={14} strokeWidth={2.5} /></div>
                <div>
                  <div className="gd-activity__name">{memberName}</div>
                  <div className="gd-activity__meta">
                    {a.debt.name} · {formatDate(a.entry.paid_at)}
                  </div>
                </div>
                <div className="gd-activity__amount" style={{ color: '#B8580B' }}>
                  −{formatMoney2(Number(a.entry.amount))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
