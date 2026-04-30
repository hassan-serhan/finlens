import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  LinearScale,
  Legend,
  Tooltip,
  type ChartConfiguration,
} from 'chart.js';
import { formatMoney } from '@/lib/format';
import type { CategorySpend } from '@/features/expenses/api/expensesApi';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Legend, Tooltip);

type Props = { data: CategorySpend[] };

// Grouped bar chart: spent vs. budgeted per category. We always show the top
// 6 by spend to keep the layout calm; categories with no budget still appear
// with budget bar = 0.
export function SpendingBars({ data }: Props) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();

    const top = [...data]
      .sort((a, b) => b.spent + b.budget - (a.spent + a.budget))
      .slice(0, 6);

    const cfg: ChartConfiguration<'bar', number[], string> = {
      type: 'bar',
      data: {
        labels: top.map((c) => c.category.label),
        datasets: [
          {
            label: t('dashboard.bars.spent'),
            data: top.map((c) => Math.round(Number(c.spent))),
            backgroundColor: '#25D366',
            borderRadius: 8,
            barPercentage: 0.6,
            categoryPercentage: 0.7,
          },
          {
            label: t('dashboard.bars.budget'),
            data: top.map((c) => Math.round(Number(c.budget))),
            backgroundColor: '#E6FFDA',
            borderRadius: 8,
            barPercentage: 0.6,
            categoryPercentage: 0.7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              boxWidth: 10,
              boxHeight: 10,
              font: { size: 12 },
              color: '#5C6970',
              padding: 14,
            },
          },
          tooltip: {
            callbacks: {
              label: (c) => `${c.dataset.label}: ${formatMoney(Number(c.parsed.y))}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 }, color: '#5C6970' },
          },
          y: {
            grid: { color: '#EEF1F3' },
            ticks: {
              font: { size: 11 },
              color: '#8A969D',
              callback: (v) => formatMoney(Number(v)),
            },
          },
        },
      },
    };

    chartRef.current = new Chart(canvasRef.current, cfg);
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [data, t]);

  if (data.length === 0) {
    return <div className="fl-dash-empty">{t('dashboard.bars.empty')}</div>;
  }

  return (
    <div className="fl-dash-bars">
      <canvas ref={canvasRef} />
    </div>
  );
}
