export function formatMoney(n: number, locale = 'en-US', currency = 'USD'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatMoney2(n: number, locale = 'en-US', currency = 'USD'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatDate(d: string | Date, locale = 'en-US'): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(date);
}

// Local-date ISO helpers. We deliberately avoid `.toISOString()` because it
// converts to UTC, which silently shifts the day across midnight for any
// timezone offset (e.g. UTC+3 turns local Apr 1 00:00 into 2026-03-31).
// Every caller (date pickers, monthly_budgets.period_month, "this month"
// filters) wants the user's *local* calendar date.
function pad2(n: number): string {
  return n < 10 ? '0' + n : '' + n;
}

export function todayISO(): string {
  const d = new Date();
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

export function firstOfMonthISO(): string {
  const d = new Date();
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-01';
}
