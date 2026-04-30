import { useTranslation } from 'react-i18next';
import { MemberCard } from './MemberCard';
import type { FamilyMember } from '@/types/db';
import './MembersGrid.css';

type Props = {
  members: FamilyMember[];
  onOpen: (m: FamilyMember) => void;
};

export function MembersGrid({ members, onOpen }: Props) {
  const { t } = useTranslation();
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 12 }}>
        {t('family.members.title')}
      </div>
      <div className="members-grid">
        {members.map((m) => (
          <MemberCard key={m.id} member={m} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}
