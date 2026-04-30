import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatDate, formatMoney2 } from '@/lib/format';
import { useWallet } from '../hooks/useWallet';
import { WalletHistoryModal } from './WalletHistoryModal';
import type { AllowanceEntry, FamilyMember } from '@/types/db';
import './Wallet.css';

type Props = {
  member: FamilyMember;
  // Bump this whenever an action that may have moved the wallet's balance
  // completes — the card refetches on change.
  refreshKey?: number;
};

// Top-of-page wallet card with the member's balance + 2 most recent entries
// + a button to open the full history. Rendered for non-Admin members.
export function WalletCard({ member, refreshKey }: Props) {
  const { t } = useTranslation();
  const { wallet, recent, loading, reload } = useWallet(member);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const balance = wallet ? Number(wallet.balance) : 0;

  return (
    <div className="wallet-bar">
      <div className="wallet-card">
        <div className="wallet-card__head">
          <div>
            <div className="wallet-card__label">{t('wallet.label')}</div>
            <div className="wallet-card__name">{member.name}</div>
          </div>
          <div className="wallet-card__icon"><WalletIcon size={22} strokeWidth={2} /></div>
        </div>
        <div className="wallet-card__balance">
          {loading && !wallet ? '—' : formatMoney2(balance)}
        </div>
        <div className="wallet-card__hint">{t('wallet.hint')}</div>
      </div>

      <div className="wallet-history">
        <div className="wallet-history__head">
          <div>
            <div className="wallet-history__title">{t('wallet.recent.title')}</div>
            <div className="wallet-history__sub">{t('wallet.recent.subtitle')}</div>
          </div>
          <button
            className="btn btn-outlined btn-sm"
            onClick={() => setHistoryOpen(true)}
            disabled={!wallet}
          >
            {t('wallet.recent.seeAll')}
          </button>
        </div>

        {loading ? (
          <div className="wallet-empty">{t('common.loading')}</div>
        ) : recent.length === 0 ? (
          <div className="wallet-empty">{t('wallet.recent.empty')}</div>
        ) : (
          recent.map((e) => <WalletEntry key={e.id} entry={e} />)
        )}
      </div>

      <WalletHistoryModal
        open={historyOpen}
        walletId={wallet?.id ?? null}
        memberName={member.name}
        onClose={() => setHistoryOpen(false)}
      />
    </div>
  );
}

function WalletEntry({ entry }: { entry: AllowanceEntry }) {
  const isCredit = entry.kind === 'credit';
  return (
    <div className="wallet-entry">
      <div className={'wallet-entry__icon ' + (isCredit ? '' : 'wallet-entry__icon--debit')}>
        {isCredit ? <ArrowDownLeft size={14} strokeWidth={2.5} /> : <ArrowUpRight size={14} strokeWidth={2.5} />}
      </div>
      <div>
        <div className="wallet-entry__name">{entry.reason}</div>
        <div className="wallet-entry__meta">{formatDate(entry.entry_date)}</div>
      </div>
      <div className={'wallet-entry__amount ' + (isCredit ? 'wallet-entry__amount--credit' : 'wallet-entry__amount--debit')}>
        {isCredit ? '+' : '−'}
        {formatMoney2(Number(entry.amount))}
      </div>
    </div>
  );
}
