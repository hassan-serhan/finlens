import { useTranslation } from 'react-i18next';
import type { FamilyMember } from '@/types/db';
import './MemberCard.css';

type Props = {
  member: FamilyMember;
  onOpen: (m: FamilyMember) => void;
};

export function MemberCard({ member, onOpen }: Props) {
  const { t } = useTranslation();
  const xp = member.xp ?? 0;
  return (
    <div className="member-card" onClick={() => onOpen(member)} role="button" tabIndex={0}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="avatar avatar--lg">{member.name.charAt(0).toUpperCase()}</div>
        <span className={`role-badge role-${member.role.toLowerCase()}`}>{member.role}</span>
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 17 }}>{member.name}</div>
        <div className="small muted">{member.relation ?? '—'}</div>
      </div>
      <div className="divider" />
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <div className="tiny muted">{t('family.member.xp')}</div>
          <div className="bold" style={{ fontSize: 14 }}>{xp.toLocaleString()}</div>
        </div>
        <div>
          <div className="tiny muted">{t('family.member.level')}</div>
          <div className="bold" style={{ fontSize: 14 }}>{member.level ?? '—'}</div>
        </div>
        <div>
          <div className="tiny muted">{t('family.member.relation')}</div>
          <div className="bold" style={{ fontSize: 14 }}>{member.relation ?? '—'}</div>
        </div>
      </div>
      <div className="member-card__bar">
        <div
          className="member-card__fill"
          style={{ width: Math.min((xp / 3000) * 100, 100) + '%' }}
        />
      </div>
    </div>
  );
}
