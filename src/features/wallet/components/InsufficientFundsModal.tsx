import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { formatMoney2 } from '@/lib/format';
import './Wallet.css';

type Props = {
  open: boolean;
  onClose: () => void;
  source: 'main' | 'wallet';
  available: number;
  requested: number;
};

export function InsufficientFundsModal({ open, onClose, source, available, requested }: Props) {
  const { t } = useTranslation();
  const shortfall = Math.max(requested - available, 0);

  return (
    <Modal
      open={open}
      title={t('wallet.warn.title')}
      subtitle={t('wallet.warn.subtitle', { source: t('wallet.source.' + source) })}
      onClose={onClose}
    >
      <div className="wallet-warn-icon"><AlertTriangle size={40} strokeWidth={1.5} /></div>
      <p style={{ textAlign: 'center', margin: '0 0 14px', color: 'var(--neutral-700)', fontSize: 13.5 }}>
        {t('wallet.warn.body', { source: t('wallet.source.' + source) })}
      </p>
      <div className="wallet-warn-stats">
        <div>
          <div className="wallet-warn-stat-label">{t('wallet.warn.available')}</div>
          <div className="wallet-warn-stat-value">{formatMoney2(available)}</div>
        </div>
        <div>
          <div className="wallet-warn-stat-label">{t('wallet.warn.needed')}</div>
          <div className="wallet-warn-stat-value" style={{ color: 'var(--danger)' }}>
            {formatMoney2(requested)}
          </div>
        </div>
      </div>
      <p style={{ textAlign: 'center', margin: '14px 0 0', fontSize: 12.5, color: 'var(--neutral-500)' }}>
        {t('wallet.warn.shortfall', { value: formatMoney2(shortfall) })}
      </p>
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 18 }}>
        <button className="btn btn-primary btn-sm" onClick={onClose}>
          {t('common.ok')}
        </button>
      </div>
    </Modal>
  );
}
