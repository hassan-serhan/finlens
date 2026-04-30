import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
  type ChartConfiguration,
} from 'chart.js';
import { formatMoney } from '@/lib/format';
import { listTransactions, type Transaction } from '@/features/expenses/api/expensesApi';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
);

type Props = { householdId: string };

function pad2(n: number) {
  return n < 10 ? '0' + n : '' + n;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function DailySpendChart({ householdId }: Props) {
  const { t, i18n } = useTranslation();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const from = `${year}-${pad2(month + 1)}-01`;
      const lastDay = daysInMonth(year, month);
      const to = `${year}-${pad2(month + 1)}-${pad2(lastDay)}`;
      const rows = await listTransactions({ householdId, fromDate: from, toDate: to });
      setTxns(rows);
    } finally {
      setLoading(false);
    }
  }, [householdId, year, month]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  // Group transactions by day-of-month for both the chart values and the
  // detailed tooltip breakdown.
  const { labels, values, txnsByDay } = useMemo(() => {
    const days = daysInMonth(year, month);
    const sumMap = new Map<number, number>();
    const listMap = new Map<number, Transaction[]>();
    for (const tx of txns) {
      const d = new Date(tx.txn_date).getDate();
      sumMap.set(d, (sumMap.get(d) ?? 0) + Number(tx.amount));
      const arr = listMap.get(d);
      if (arr) arr.push(tx);
      else listMap.set(d, [tx]);
    }
    const lbls: string[] = [];
    const vals: number[] = [];
    for (let d = 1; d <= days; d++) {
      lbls.push(String(d));
      vals.push(Math.round((sumMap.get(d) ?? 0) * 100) / 100);
    }
    return { labels: lbls, values: vals, txnsByDay: listMap };
  }, [txns, year, month]);

  const totalMonth = useMemo(() => values.reduce((s, v) => s + v, 0), [values]);

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();

    const cfg: ChartConfiguration<'line', number[], string> = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: t('dashboard.dailySpend.spent'),
            data: values,
            borderColor: '#25D366',
            backgroundColor: 'rgba(37, 211, 102, 0.10)',
            pointBackgroundColor: '#25D366',
            pointRadius: 3,
            pointHoverRadius: 5,
            borderWidth: 2.5,
            fill: true,
            tension: 0.35,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            displayColors: false,
            bodyFont: { size: 12 },
            titleFont: { size: 13, weight: 'bold' as const },
            padding: { top: 8, bottom: 8, left: 10, right: 10 },
            callbacks: {
              title: (items) => {
                const day = items[0]?.label;
                const total = formatMoney(Number(items[0]?.parsed.y ?? 0));
                return `${t('dashboard.dailySpend.tooltipDay', { day })}  —  ${total}`;
              },
              label: () => '',
              afterBody: (items) => {
                const dayNum = Number(items[0]?.label);
                const dayTxns = txnsByDay.get(dayNum);
                if (!dayTxns || dayTxns.length === 0) return [];
                const MAX_ROWS = 4;
                const lines = dayTxns.slice(0, MAX_ROWS).map(
                  (tx) => `• ${tx.description}  ${formatMoney(Number(tx.amount))}`
                );
                if (dayTxns.length > MAX_ROWS) {
                  lines.push(
                    t('dashboard.dailySpend.tooltipMore', {
                      count: dayTxns.length - MAX_ROWS,
                    })
                  );
                }
                return lines;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 10 },
              color: '#8A969D',
              maxTicksLimit: 15,
            },
          },
          y: {
            grid: { color: '#EEF1F3' },
            ticks: {
              font: { size: 10 },
              color: '#8A969D',
              callback: (v) => formatMoney(Number(v)),
            },
            beginAtZero: true,
          },
        },
      },
    };

    chartRef.current = new Chart(canvasRef.current, cfg);
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [labels, values, txnsByDay, t]);

  const monthOptions = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(i18n.language, { month: 'long' });
    return Array.from({ length: 12 }, (_, i) => ({
      value: i,
      label: fmt.format(new Date(2024, i, 1)),
    }));
  }, [i18n.language]);

  const yearOptions = useMemo(() => {
    const cur = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => cur - 4 + i);
  }, []);

  return (
    <>
      <div className="fl-daily-picker">
        <select
          className="fl-daily-select"
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
        >
          {monthOptions.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <select
          className="fl-daily-select"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <span className="fl-daily-total">
          {t('dashboard.dailySpend.total')}: <strong>{formatMoney(totalMonth)}</strong>
        </span>
      </div>

      {loading ? (
        <div className="fl-dash-empty">{t('common.loading')}</div>
      ) : (
        <div className="fl-daily-chart">
          <canvas ref={canvasRef} />
        </div>
      )}
    </>
  );
}
