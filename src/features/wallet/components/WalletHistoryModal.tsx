import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatDate, formatMoney2 } from '@/lib/format';
import { listWalletEntries } from '../api/walletApi';
import type { AllowanceEntry } from '@/types/db';
import './Wallet.css';

type Props = {
  open: boolean;
  walletId: string | null;
  memberName: string;
  onClose: () => void;
};

// Full history viewer for a member's wallet. Loads on open and when the wallet
// id changes; the parent (WalletCard) just toggles `open`.
export function WalletHistoryModal({ open, walletId, memberName, onClose }: Props) {
  const { t } = useTranslation();
  const [items, setItems] = useState<AllowanceEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !walletId) return;
    let cancelled = false;
    setLoading(true);
    void listWalletEntries(walletId).then((rows) => {
      if (cancelled) return;
      setItems(rows);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [open, walletId]);

  return (
    <Modal
      open={open}
      title={t('wallet.history.title', { name: memberName })}
      subtitle={t('wallet.history.subtitle', { count: items.length })}
      onClose={onClose}
    >
      {loading ? (
        <div className="empty">{t('common.loading')}</div>
      ) : items.length === 0 ? (
        <div className="wallet-empty">{t('wallet.history.empty')}</div>
      ) : (
        <div style={{ display: 'grid', gap: 6, maxHeight: '60vh', overflowY: 'auto' }}>
          {items.map((e) => (
            <WalletEntry key={e.id} entry={e} />
          ))}
        </div>
      )}
    </Modal>
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
