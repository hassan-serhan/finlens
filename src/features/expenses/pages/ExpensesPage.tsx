import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { useHousehold } from '@/features/household/hooks/useHousehold';
import { WalletCard } from '@/features/wallet/components/WalletCard';
import { InsufficientFundsModal } from '@/features/wallet/components/InsufficientFundsModal';
import { AddExpenseCard } from '../components/AddExpenseCard';
import { MonthAtGlanceCard } from '../components/MonthAtGlanceCard';
import { TransactionsCard } from '../components/TransactionsCard';

export function ExpensesPage() {
  const { t } = useTranslation();
  const { householdId, member, loading, error } = useHousehold();
  const [version, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);
  const [warn, setWarn] = useState<{ available: number; requested: number } | null>(null);

  const isMember = member?.role === 'Member';

  return (
    <AppLayout>
      <header style={{ marginBlockEnd: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
          {t('expenses.title')}
        </h1>
        <p style={{ color: 'var(--neutral-500)', margin: '4px 0 0', fontSize: 13.5 }}>
          {t('expenses.subtitle')}
        </p>
      </header>

      {loading && <div className="empty">{t('common.loading')}</div>}
      {error && <div className="empty" style={{ color: 'var(--danger)' }}>{error}</div>}

      {householdId && member && (
        <>
          {isMember && <WalletCard member={member} refreshKey={version} />}

          <div className="grid grid-12" style={{ alignItems: 'start' }}>
            <div className="span-5">
              <AddExpenseCard
                householdId={householdId}
                member={member}
                onAdded={bump}
                onInsufficientFunds={(available, requested) => setWarn({ available, requested })}
              />
              <MonthAtGlanceCard householdId={householdId} refreshKey={version} />
            </div>

            <div className="span-7">
              <TransactionsCard
                householdId={householdId}
                refreshKey={version}
                onChange={bump}
              />
            </div>
          </div>
        </>
      )}

      <InsufficientFundsModal
        open={!!warn}
        onClose={() => setWarn(null)}
        source={isMember ? 'wallet' : 'main'}
        available={warn?.available ?? 0}
        requested={warn?.requested ?? 0}
      />
    </AppLayout>
  );
}
