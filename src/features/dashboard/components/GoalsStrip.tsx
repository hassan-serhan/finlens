import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Target } from 'lucide-react';
import { formatDate, formatMoney } from '@/lib/format';
import type { SavingsGoal } from '@/types/db';

type Props = { goals: SavingsGoal[] };

const TONES: Array<'featured' | 'tint' | 'warm'> = ['featured', 'tint', 'warm'];

// Top 3 savings goals as featured cards. The first card is "featured" (dark
// gradient + light text); the other two use mint and warm-cream tones to
// give the row visual rhythm.
export function GoalsStrip({ goals }: Props) {
  const { t } = useTranslation();
  const top = goals.slice(0, 3);

  if (top.length === 0) {
    return <div className="fl-dash-empty">{t('dashboard.goals.empty')}</div>;
  }

  return (
    <div className="fl-dash-goals">
      {top.map((g, i) => {
        const saved = Number(g.saved);
        const target = Number(g.target);
        const pct = target > 0 ? Math.min(Math.round((saved / target) * 100), 100) : 0;
        const tone = TONES[i] ?? 'tint';
        return (
          <Link
            key={g.id}
            to="/goals"
            className={`fl-goal-card fl-goal-card--${tone}`}
            aria-label={t('dashboard.goals.openCard', { name: g.name })}
          >
            <div className="fl-goal-card__row">
              <div className="fl-goal-card__icon">
                {g.icon
                  ? <span style={{ fontSize: 20 }}>{g.icon}</span>
                  : <Target size={20} strokeWidth={2} />
                }
              </div>
              <span className="fl-goal-card__chip">
                {g.due_date
                  ? t('dashboard.goals.dueBy', { value: formatDate(g.due_date) })
                  : t('dashboard.goals.noDue')}
              </span>
            </div>
            <div>
              <div className="fl-goal-card__name">{g.name}</div>
              <div className="fl-goal-card__sub">
                {t('dashboard.goals.savedOf', {
                  saved: formatMoney(saved),
                  target: formatMoney(target),
                })}
              </div>
            </div>
            <div className="fl-goal-card__bar">
              <div className="fl-goal-card__fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="fl-goal-card__row">
              <span className="fl-goal-card__pct">{pct}%</span>
              <span className="fl-goal-card__priority">
                {t('goals.priority.' + g.priority)}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
