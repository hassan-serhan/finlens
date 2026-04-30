import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import type { FamilyMember } from '@/types/db';

type Props = {
  member: FamilyMember | null;
  onClose: () => void;
};

export function MemberDetailModal({ member, onClose }: Props) {
  const { t } = useTranslation();
  if (!member) return null;

  return (
    <Modal open={!!member} title={member.name} subtitle={member.relation ?? '—'} onClose={onClose}>
      <div className="row" style={{ gap: 18, marginBottom: 18 }}>
        <div className="avatar avatar--lg">{member.name.charAt(0).toUpperCase()}</div>
        <div>
          <div className="row" style={{ gap: 10 }}>
            <span className={`role-badge role-${member.role.toLowerCase()}`}>{member.role}</span>
          </div>
          <div className="small muted" style={{ marginTop: 4 }}>{member.level ?? '—'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 18 }}>
        <Stat label={t('family.member.xp')} value={(member.xp ?? 0).toLocaleString()} />
        <Stat label={t('family.member.level')} value={member.level ?? '—'} />
        <Stat label={t('family.member.role')} value={member.role} />
      </div>

      <div className="small muted">
        {t('family.detail.invited', { value: new Date(member.created_at).toLocaleDateString() })}
      </div>
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--neutral-50)', padding: 14, borderRadius: 12 }}>
      <div className="small muted">{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>{value}</div>
    </div>
  );
}
