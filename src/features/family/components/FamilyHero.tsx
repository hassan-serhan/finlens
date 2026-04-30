import { useTranslation } from 'react-i18next';
import type { FamilyMember, Household } from '@/types/db';
import './FamilyHero.css';

type Props = {
  household: Household | null;
  members: FamilyMember[];
  canInvite: boolean;
  onInvite: () => void;
};

export function FamilyHero({ household, members, canInvite, onInvite }: Props) {
  const { t } = useTranslation();
  const totalXp = members.reduce((s, m) => s + (m.xp ?? 0), 0);
  const since = household?.created_at
    ? new Date(household.created_at).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      })
    : '—';

  return (
    <div className="card">
      <div className="hero">
        <div className="hero__left">
          <div className="hero__avatars">
            {members.slice(0, 5).map((m) => (
              <div key={m.id} className="avatar avatar--lg">
                {m.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
          <div>
            <div className="hero__title">
              {household?.name ?? t('family.hero.titleFallback')}
            </div>
            <div className="small muted" style={{ marginTop: 4 }}>
              {members.length} {t('family.hero.members')} ·{' '}
              {t('family.hero.since', { value: since })} ·{' '}
              {totalXp.toLocaleString()} {t('family.hero.familyXp')}
            </div>
          </div>
        </div>
        {canInvite && (
          <div className="hero__actions">
            <button className="btn btn-primary" onClick={onInvite}>
              + {t('family.hero.invite')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
