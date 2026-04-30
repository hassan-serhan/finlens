import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { useHousehold } from '@/features/household/hooks/useHousehold';
import { useIncome } from '@/features/income/hooks/useIncome';
import { AccountsSection } from '@/features/accounts/components/AccountsSection';
import { BudgetSection } from '@/features/budgets/components/BudgetSection';
import { IncomeSourcesCard, IncomeLedgerCard } from '@/features/income/components/IncomeSection';
import { AllowanceSection } from '@/features/family/components/AllowanceSection';

export function IncomePage() {
  const { t } = useTranslation();
  const { householdId, member, loading, error } = useHousehold();
  const [version, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);

  return (
    <AppLayout>
      <header style={{ marginBlockEnd: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
          {t('income.title')}
        </h1>
        <p style={{ color: 'var(--neutral-500)', margin: '4px 0 0', fontSize: 13.5 }}>
          {t('income.subtitle')}
        </p>
      </header>

      {loading && <div className="empty">{t('common.loading')}</div>}
      {error && <div className="empty" style={{ color: 'var(--danger)' }}>{error}</div>}

      {householdId && member && (
        <IncomePageBody householdId={householdId} memberId={member.id} adminMember={member} version={version} bump={bump} />
      )}
    </AppLayout>
  );
}

function IncomePageBody({
  householdId,
  memberId,
  adminMember,
  version,
  bump,
}: {
  householdId: string;
  memberId: string;
  adminMember: import('@/types/db').FamilyMember;
  version: number;
  bump: () => void;
}) {
  // Single source of truth for current-month income on this page.
  // BudgetSection, IncomeSourcesCard, IncomeLedgerCard, and AllowanceSection
  // all read from this — collapses 3-4 duplicate income_sources queries to one.
  const { items, total, create, remove } = useIncome(householdId, memberId);

  const onCreate: typeof create = async (input) => {
    await create(input);
    bump();
  };
  const onRemove: typeof remove = async (i) => {
    await remove(i);
    bump();
  };

  return (
    <div className="grid grid-12" style={{ alignItems: 'start' }}>
      <div className="span-4">
        <AccountsSection householdId={householdId} onChange={bump} />
      </div>

      <div className="span-8">
        <BudgetSection householdId={householdId} incomeTotal={total} refreshKey={version} />
      </div>

      <div className="span-5">
        <IncomeSourcesCard items={items} total={total} create={onCreate} />
      </div>

      <div className="span-7">
        <IncomeLedgerCard items={items} remove={onRemove} />
      </div>

      <div className="span-12">
        <AllowanceSection adminMember={adminMember} incomeTotal={total} />
      </div>
    </div>
  );
}
