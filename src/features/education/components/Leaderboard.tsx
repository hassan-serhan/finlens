import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy } from 'lucide-react';
import type { EduBadge, FamilyMember } from '@/types/db';

type Props = {
  members: FamilyMember[];
  allBadges: EduBadge[];
};

const MAX_XP = 3000;

const AVATAR_COLORS = ['#25D366', '#6C5CE7', '#FD79A8', '#FDCB6E', '#00CEC9', '#E17055'];

export function Leaderboard({ members, allBadges }: Props) {
  const { t } = useTranslation();

  const badgesByMember = useMemo(() => {
    const map = new Map<string, EduBadge[]>();
    allBadges.forEach((b) => {
      const arr = map.get(b.member_id);
      if (arr) arr.push(b);
      else map.set(b.member_id, [b]);
    });
    return map;
  }, [allBadges]);

  const ranked = useMemo(
    () => [...members].sort((a, b) => (b.xp || 0) - (a.xp || 0)),
    [members]
  );

  return (
    <div className="edu-leaderboard">
      {ranked.map((m, i) => {
        const mBadges = badgesByMember.get(m.id) || [];
        const xp = m.xp || 0;
        const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
        return (
          <div
            key={m.id}
            className={'edu-leaderboard__row' + (i === 0 ? ' edu-leaderboard__row--first' : '')}
          >
            <div className="edu-leaderboard__rank">#{i + 1}</div>
            <div className="edu-leaderboard__avatar" style={{ background: color + '22', color }}>
              {m.initials || m.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="edu-leaderboard__name">
              <div className="edu-leaderboard__name-text">{m.name}</div>
              <div className="edu-leaderboard__name-level">{m.level || t('education.leaderboard.learner')}</div>
            </div>
            <div className="edu-leaderboard__bar">
              <div className="edu-xp-bar">
                <div className="edu-xp-bar__fill" style={{ width: (xp / MAX_XP) * 100 + '%' }} />
              </div>
            </div>
            <div className="edu-leaderboard__xp">{xp} XP</div>
            <div className="edu-leaderboard__badges-col">
              {mBadges.slice(0, 4).map((b) => (
                <span key={b.id} style={{ fontSize: 16, color: '#F59E0B', display: 'inline-flex' }} title={b.badge_name}>
                  <Trophy size={16} strokeWidth={1.5} />
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
