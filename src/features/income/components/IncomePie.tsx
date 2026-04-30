import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Chart,
  ArcElement,
  DoughnutController,
  Tooltip,
  Legend,
  type ChartConfiguration,
} from 'chart.js';
import { formatMoney } from '@/lib/format';
import type { IncomeSource } from '@/types/db';

Chart.register(ArcElement, DoughnutController, Tooltip, Legend);

type Props = { income: IncomeSource[] };

export function IncomePie({ income }: Props) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();

    const cfg: ChartConfiguration<'doughnut', number[], string> = {
      type: 'doughnut',
      data: {
        labels: income.map((i) => i.source),
        datasets: [
          {
            data: income.map((i) => Number(i.amount)),
            backgroundColor: income.map((i) => i.color ?? '#25D366'),
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        cutout: '64%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) => `${c.label}: ${formatMoney(Number(c.parsed))}`,
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
  }, [income]);

  const total = income.reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto' }}>
      <canvas ref={canvasRef} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <div>
          <div className="tiny muted">{t('income.income.monthly')}</div>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
            {formatMoney(total)}
          </div>
        </div>
      </div>
    </div>
  );
}
