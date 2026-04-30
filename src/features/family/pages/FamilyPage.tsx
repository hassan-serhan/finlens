import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { useHousehold } from '@/features/household/hooks/useHousehold';
import { getHousehold } from '@/features/household/api/householdApi';
import { WalletCard } from '@/features/wallet/components/WalletCard';
import { listMembers } from '../api/familyApi';
import { FamilyHero } from '../components/FamilyHero';
import { MembersGrid } from '../components/MembersGrid';
import { PermissionsCard } from '../components/PermissionsCard';
import { InviteMemberModal } from '../components/InviteMemberModal';
import { MemberDetailModal } from '../components/MemberDetailModal';
import '../components/permissions.css';
import type { FamilyMember, Household } from '@/types/db';

export function FamilyPage() {
  const { t } = useTranslation();
  const { householdId, member: caller, loading, error } = useHousehold();
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [open, setOpen] = useState<FamilyMember | null>(null);
  const [inviting, setInviting] = useState(false);

  const isAdmin = caller?.role === 'Admin';
  const isMember = caller?.role === 'Member';

  const load = async () => {
    if (!householdId) return;
    const [hh, mems] = await Promise.all([getHousehold(householdId), listMembers(householdId)]);
    setHousehold(hh);
    setMembers(mems);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [householdId]);

  return (
    <AppLayout>
      <header style={{ marginBlockEnd: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
          {t('family.title')}
        </h1>
        <p style={{ color: 'var(--neutral-500)', margin: '4px 0 0', fontSize: 13.5 }}>
          {t('family.subtitle')}
        </p>
      </header>

      {loading && <div className="empty">{t('common.loading')}</div>}
      {error && <div className="empty" style={{ color: 'var(--danger)' }}>{error}</div>}

      {householdId && caller && isMember && <WalletCard member={caller} />}

      {householdId && (
        <div className="grid grid-12">
          <div className="span-12">
            <FamilyHero
              household={household}
              members={members}
              canInvite={isAdmin}
              onInvite={() => setInviting(true)}
            />
          </div>

          <div className="span-12">
            <MembersGrid members={members} onOpen={setOpen} />
          </div>

          <div className="span-12">
            <PermissionsCard />
          </div>
        </div>
      )}

      <InviteMemberModal
        open={inviting}
        onClose={() => setInviting(false)}
        onInvited={async () => {
          setInviting(false);
          await load();
        }}
      />

      <MemberDetailModal member={open} onClose={() => setOpen(null)} />
    </AppLayout>
  );
}
