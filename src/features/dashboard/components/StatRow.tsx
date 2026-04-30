import { useTranslation } from 'react-i18next';
import { TrendingDown, Sparkles, Target, Shield, type LucideIcon } from 'lucide-react';
import { formatMoney } from '@/lib/format';
import type { DashboardKpis } from '../hooks/useDashboard';

type Props = {
  kpis: DashboardKpis;
  goalsCount: number;
};

export function StatRow({ kpis, goalsCount }: Props) {
  const { t } = useTranslation();

  return (
    <div className="fl-dash-stats">
      <StatTile
        Icon={TrendingDown}
        tone="default"
        label={t('dashboard.stats.spent.label')}
        value={formatMoney(kpis.monthSpent)}
        meta={
          kpis.monthBudget > 0
            ? t('dashboard.stats.spent.ofBudget', { value: formatMoney(kpis.monthBudget) })
            : t('dashboard.stats.spent.noBudget')
        }
        metaTone={kpis.monthBudget > 0 && kpis.monthSpent > kpis.monthBudget ? 'down' : 'neutral'}
      />
      <StatTile
        Icon={Sparkles}
        tone="mint"
        label={t('dashboard.stats.saved.label')}
        value={formatMoney(kpis.monthSaved)}
        meta={t('dashboard.stats.saved.meta', { count: goalsCount })}
        metaTone="up"
      />
      <StatTile
        Icon={Target}
        tone="cream"
        label={t('dashboard.stats.totalSaved.label')}
        value={formatMoney(kpis.totalSaved)}
        meta={
          kpis.totalGoalsTarget > 0
            ? t('dashboard.stats.totalSaved.meta', { value: formatMoney(kpis.totalGoalsTarget) })
            : t('dashboard.stats.totalSaved.empty')
        }
        metaTone="neutral"
      />
      <StatTile
        Icon={Shield}
        tone="warm"
        label={t('dashboard.stats.debt.label')}
        value={kpis.debtTotal > 0 ? `${kpis.debtPct}%` : '—'}
        meta={
          kpis.debtTotal > 0
            ? t('dashboard.stats.debt.meta', { value: formatMoney(kpis.debtRemaining) })
            : t('dashboard.stats.debt.empty')
        }
        metaTone="neutral"
      />
    </div>
  );
}

type StatTileProps = {
  Icon: LucideIcon;
  label: string;
  value: string;
  meta: string;
  tone: 'default' | 'mint' | 'cream' | 'warm';
  metaTone: 'up' | 'down' | 'neutral';
};

function StatTile({ Icon, label, value, meta, tone, metaTone }: StatTileProps) {
  return (
    <div className={`fl-stat fl-stat--${tone}`}>
      <div className="fl-stat__head">
        <span className="fl-stat__icon">
          <Icon size={18} strokeWidth={2} />
        </span>
        <span className="fl-stat__label">{label}</span>
      </div>
      <div className="fl-stat__value">{value}</div>
      <div className={`fl-stat__meta fl-stat__meta--${metaTone}`}>{meta}</div>
    </div>
  );
}
