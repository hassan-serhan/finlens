import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Chart,
  ArcElement,
  DoughnutController,
  Tooltip,
  type ChartConfiguration,
} from 'chart.js';
import { formatMoney } from '@/lib/format';
import type { CategorySpend } from '@/features/expenses/api/expensesApi';

Chart.register(ArcElement, DoughnutController, Tooltip);

type Props = { data: CategorySpend[] };

// Convert "#rrggbb" / "#rgb" to a translucent rgba() so a category's
// "remaining budget" half can sit next to its "used" half visually as a
// quieter shade of the same hue.
function toRgba(hex: string, alpha: number): string {
  let h = (hex || '').replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) return `rgba(238, 241, 243, ${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Doughnut chart broken into one arc per category. Each category arc is sized
// by its share of the total monthly budget, then internally split into a
// solid "used" segment + a faded "remaining" segment in the same hue. The
// center keeps the overall % used so users still see the headline number.
export function BudgetRing({ data }: Props) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  const segments = useMemo(() => {
    return data
      .filter((c) => Number(c.budget) > 0)
      .map((c) => {
        const budget = Number(c.budget);
        const spent = Number(c.spent);
        return {
          id: c.category.id,
          label: c.category.label,
          color: c.category.color ?? '#25D366',
          budget,
          spent,
          // Visual used clamps at budget so the arc never overfills its slot;
          // we surface the actual overspend in tooltip + legend instead.
          used: Math.min(spent, budget),
          remaining: Math.max(budget - spent, 0),
          over: spent > budget,
        };
      });
  }, [data]);

  const totalBudget = useMemo(() => segments.reduce((s, x) => s + x.budget, 0), [segments]);
  const totalSpent = useMemo(() => segments.reduce((s, x) => s + x.spent, 0), [segments]);
  const pct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const over = totalBudget > 0 && totalSpent > totalBudget;

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();

    const labels: string[] = [];
    const values: number[] = [];
    const colors: string[] = [];

    if (segments.length === 0) {
      labels.push(t('dashboard.budgetRing.noBudget'));
      values.push(1);
      colors.push('#EEF1F3');
    } else {
      for (const s of segments) {
        labels.push(`${s.label} · ${t('dashboard.budgetRing.spent')}`);
        values.push(s.used);
        colors.push(s.color);

        labels.push(`${s.label} · ${t('dashboard.budgetRing.remaining')}`);
        values.push(s.remaining);
        colors.push(toRgba(s.color, 0.18));
      }
    }

    const cfg: ChartConfiguration<'doughnut', number[], string> = {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors,
            borderColor: '#ffffff',
            borderWidth: 2,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: segments.length > 0,
            callbacks: {
              label: (c) => `${c.label}: ${formatMoney(Number(c.parsed))}`,
            },
          },
        },
        animation: { animateRotate: true, duration: 600 },
      },
    };

    chartRef.current = new Chart(canvasRef.current, cfg);
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [segments, t]);

  return (
    <div className="fl-dash-ring">
      <canvas ref={canvasRef} />
      <div className="fl-dash-ring__center">
        {totalBudget > 0 ? (
          <>
            <div
              className="fl-dash-ring__pct"
              style={over ? { color: 'var(--danger)' } : undefined}
            >
              {pct}%
            </div>
            <div className="fl-dash-ring__sub">
              {t('dashboard.budgetRing.ofBudget', { value: formatMoney(totalBudget) })}
            </div>
          </>
        ) : (
          <>
            <div className="fl-dash-ring__pct" style={{ fontSize: 18 }}>
              {t('dashboard.budgetRing.noBudget')}
            </div>
            <div className="fl-dash-ring__sub">{t('dashboard.budgetRing.setBudget')}</div>
          </>
        )}
      </div>
    </div>
  );
}
