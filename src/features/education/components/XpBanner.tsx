import { useTranslation } from 'react-i18next';
import { Trophy } from 'lucide-react';
import type { EduBadge, FamilyMember } from '@/types/db';

type Props = {
  member: FamilyMember;
  badges: EduBadge[];
};

const NEXT_LEVEL_XP = 3000;

export function XpBanner({ member, badges }: Props) {
  const { t } = useTranslation();
  const xp = member.xp || 0;
  const pct = Math.min((xp / NEXT_LEVEL_XP) * 100, 100);

  return (
    <div className="edu-hero">
      <div className="edu-hero__decor1" />
      <div className="edu-hero__decor2" />
      <div className="edu-hero__inner">
        <div className="edu-hero__avatar">
          {member.initials || member.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="edu-hero__info">
          <div className="edu-hero__name">
            <span>{t('education.xp.path', { name: member.name })}</span>
            {member.level && <span className="edu-hero__level">{member.level}</span>}
          </div>
          <div className="edu-hero__xp-text">
            {t('education.xp.earned', { xp })} · {t('education.xp.toNext', { xp: Math.max(NEXT_LEVEL_XP - xp, 0) })}
          </div>
          <div className="edu-hero__xp-bar">
            <div className="edu-hero__xp-fill" style={{ width: pct + '%' }} />
          </div>
        </div>
        {badges.length > 0 && (
          <div className="edu-hero__badges">
            {badges.slice(0, 5).map((b) => (
              <div key={b.id} className="edu-hero__badge" title={b.badge_name}>
                  <Trophy size={16} strokeWidth={2} />
                </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
