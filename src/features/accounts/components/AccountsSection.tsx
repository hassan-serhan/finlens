import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, Building2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { formatMoney2 } from '@/lib/format';
import { adjustAccountBalance, listAccounts, setAccountBalance } from '../api/accountsApi';
import type { Account } from '@/types/db';
import './AccountsSection.css';

type Props = { householdId: string; onChange?: () => void };

export function AccountsSection({ householdId, onChange }: Props) {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [editing, setEditing] = useState<Account | null>(null);

  const load = async () => setAccounts(await listAccounts(householdId));

  useEffect(() => {
    void load();
  }, [householdId]);

  const main = accounts.find((a) => a.kind === 'main');
  const savings = accounts.find((a) => a.kind === 'savings');

  return (
    <div className="acct-stack">
      {main && (
        <article className="card card-dark acct-card">
          <span className="acct-card__halo" />
          <header className="acct-card__head">
            <div className="acct-card__brand">
              <div className="acct-card__icon acct-card__icon--main">
                {main.icon ? <span>{main.icon}</span> : <CreditCard size={20} strokeWidth={2} />}
              </div>
              <div>
                <div className="acct-card__name">{t('income.accounts.main.name')}</div>
                <div className="acct-card__last">•••• {main.last4 ?? '0000'}</div>
              </div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setEditing(main)}>
              + {t('income.accounts.adjust')}
            </button>
          </header>
          <div className="acct-card__balance">{formatMoney2(main.balance)}</div>
          <div className="acct-card__hint">{t('income.accounts.mainHint')}</div>
        </article>
      )}

      {savings && (
        <article className="card card-tint acct-card">
          <span className="acct-card__halo acct-card__halo--tint" />
          <header className="acct-card__head">
            <div className="acct-card__brand">
              <div className="acct-card__icon acct-card__icon--savings">
                {savings.icon ? <span>{savings.icon}</span> : <Building2 size={20} strokeWidth={2} />}
              </div>
              <div>
                <div className="acct-card__name">{t('income.accounts.savings.name')}</div>
                <div className="acct-card__last acct-card__last--tint">•••• {savings.last4 ?? '0000'}</div>
              </div>
            </div>
            <button className="btn btn-inverted btn-sm" onClick={() => setEditing(savings)}>
              + {t('income.accounts.adjust')}
            </button>
          </header>
          <div className="acct-card__balance acct-card__balance--tint">{formatMoney2(savings.balance)}</div>
          <div className="acct-card__hint acct-card__hint--tint">{t('income.accounts.savingsHint')}</div>
        </article>
      )}

      <AdjustBalanceModal
        account={editing}
        onClose={() => setEditing(null)}
        onSaved={async () => {
          setEditing(null);
          await load();
          onChange?.();
        }}
      />
    </div>
  );
}

function AdjustBalanceModal({
  account,
  onClose,
  onSaved,
}: {
  account: Account | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'set' | 'add' | 'sub'>('set');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (account) {
      setMode('add');
      setAmount('');
    }
  }, [account]);

  if (!account) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(amount);
    if (Number.isNaN(n)) return;
    setBusy(true);
    try {
      if (mode === 'set') await setAccountBalance(account.id, n);
      else await adjustAccountBalance(account.id, account.balance, mode === 'add' ? n : -n);
      onSaved();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={!!account}
      title={t('income.accounts.adjustTitle', { name: t(`income.accounts.${account.kind}.name`) })}
      subtitle={t('income.accounts.currentBalance', { value: formatMoney2(account.balance) })}
      onClose={onClose}
    >
      <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
        <div className="tab-bar" style={{ alignSelf: 'flex-start' }}>
          {(['set', 'add', 'sub'] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={['tab-btn', mode === m ? 'active' : ''].join(' ')}
              onClick={() => setMode(m)}
            >
              {t(`income.accounts.mode.${m}`)}
            </button>
          ))}
        </div>
        <div className="field">
          <label htmlFor="amount">{t('income.accounts.amount')}</label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
            required
          />
        </div>
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
