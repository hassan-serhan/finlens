import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingDown, Target, Shield } from 'lucide-react';
import { formatMoney } from '@/lib/format';
import { CategoryIcon } from '@/lib/icons';
import type {
  Category,
  Debt,
  DebtPayment,
  FamilyMember,
  GoalContribution,
  SavingsGoal,
} from '@/types/db';
import type { Transaction } from '@/features/expenses/api/expensesApi';

type ActivityItem =
  | { kind: 'expense'; at: string; entry: Transaction; member: FamilyMember | null; category: Category | null }
  | { kind: 'goal'; at: string; entry: GoalContribution; member: FamilyMember | null; goal: SavingsGoal }
  | { kind: 'debt'; at: string; entry: DebtPayment; member: FamilyMember | null; debt: Debt };

type Props = {
  transactions: Transaction[];
  contributions: GoalContribution[];
  debtPayments: DebtPayment[];
  goalsById: Record<string, SavingsGoal>;
  debtsById: Record<string, Debt>;
  membersById: Record<string, FamilyMember>;
  categoriesById: Record<string, Category>;
};

const MAX_ITEMS = 8;

// Merged feed of recent expenses, goal contributions and debt payments
// across the whole household, newest first.
export function ActivityFeed({
  transactions,
  contributions,
  debtPayments,
  goalsById,
  debtsById,
  membersById,
  categoriesById,
}: Props) {
  const { t, i18n } = useTranslation();

  const items = useMemo<ActivityItem[]>(() => {
    const expenses: ActivityItem[] = transactions.map((tx) => ({
      kind: 'expense',
      at: tx.created_at ?? `${tx.txn_date}T00:00:00`,
      entry: tx,
      member: tx.member_id ? membersById[tx.member_id] ?? null : null,
      category: tx.category_id ? categoriesById[tx.category_id] ?? null : null,
    }));

    const goalEntries: ActivityItem[] = contributions
      .filter((c) => goalsById[c.goal_id])
      .map((c) => ({
        kind: 'goal',
        at: c.contributed_at,
        entry: c,
        member: c.member_id ? membersById[c.member_id] ?? null : null,
        goal: goalsById[c.goal_id],
      }));

    const debtEntries: ActivityItem[] = debtPayments
      .filter((p) => debtsById[p.debt_id])
      .map((p) => ({
        kind: 'debt',
        at: p.paid_at,
        entry: p,
        member: p.member_id ? membersById[p.member_id] ?? null : null,
        debt: debtsById[p.debt_id],
      }));

    return [...expenses, ...goalEntries, ...debtEntries]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, MAX_ITEMS);
  }, [transactions, contributions, debtPayments, goalsById, debtsById, membersById, categoriesById]);

  if (items.length === 0) {
    return <div className="fl-dash-empty">{t('dashboard.activity.empty')}</div>;
  }

  return (
    <div className="fl-dash-feed">
      {items.map((it) => (
        <ActivityRow key={`${it.kind}-${it.entry.id}`} item={it} locale={i18n.language} t={t} />
      ))}
    </div>
  );
}

function ActivityRow({
  item,
  locale,
  t,
}: {
  item: ActivityItem;
  locale: string;
  t: (k: string, opts?: Record<string, unknown>) => string;
}) {
  const memberName = item.member?.name ?? t('dashboard.activity.someone');
  const time = relativeTime(item.at, locale, t);

  if (item.kind === 'expense') {
    const cat = item.category;
    return (
      <div className="fl-feed-row">
        <Avatar member={item.member} fallback="expense" />
        <div className="fl-feed-row__body">
          <div className="fl-feed-row__text">
            <span className="fl-feed-row__who">{memberName}</span>{' '}
            {t('dashboard.activity.expense', {
              amount: formatMoney(Number(item.entry.amount)),
              what: item.entry.description,
            })}{' '}
            {cat?.icon && <span aria-hidden style={{ display: 'inline-flex', verticalAlign: 'middle', marginInlineStart: 4 }}><CategoryIcon icon={cat.icon} size={14} /></span>}
          </div>
          <div className="fl-feed-row__time">{time}</div>
        </div>
        <div className="fl-feed-row__amt fl-feed-row__amt--out">
          −{formatMoney(Number(item.entry.amount))}
        </div>
      </div>
    );
  }

  if (item.kind === 'goal') {
    return (
      <div className="fl-feed-row">
        <Avatar member={item.member} fallback="goal" />
        <div className="fl-feed-row__body">
          <div className="fl-feed-row__text">
            <span className="fl-feed-row__who">{memberName}</span>{' '}
            {t('dashboard.activity.goal', {
              amount: formatMoney(Number(item.entry.amount)),
              what: item.goal.name,
            })}{' '}
            {item.goal.icon && <span aria-hidden>{item.goal.icon}</span>}
          </div>
          <div className="fl-feed-row__time">{time}</div>
        </div>
        <div className="fl-feed-row__amt fl-feed-row__amt--in">
          +{formatMoney(Number(item.entry.amount))}
        </div>
      </div>
    );
  }

  return (
    <div className="fl-feed-row">
      <Avatar member={item.member} fallback="debt" />
      <div className="fl-feed-row__body">
        <div className="fl-feed-row__text">
          <span className="fl-feed-row__who">{memberName}</span>{' '}
          {t('dashboard.activity.debt', {
            amount: formatMoney(Number(item.entry.amount)),
            what: item.debt.name,
          })}{' '}
          {item.debt.icon && <span aria-hidden>{item.debt.icon}</span>}
        </div>
        <div className="fl-feed-row__time">{time}</div>
      </div>
      <div className="fl-feed-row__amt fl-feed-row__amt--debt">
        −{formatMoney(Number(item.entry.amount))}
      </div>
    </div>
  );
}

function Avatar({ member, fallback }: { member: FamilyMember | null; fallback: 'expense' | 'goal' | 'debt' }) {
  if (!member) {
    const Icon = fallback === 'expense' ? TrendingDown : fallback === 'goal' ? Target : Shield;
    return (
      <div className="fl-feed-row__avatar fl-feed-row__avatar--ghost">
        <Icon size={16} strokeWidth={2} />
      </div>
    );
  }
  const initials =
    member.initials ||
    member.name
      .split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  return <div className="fl-feed-row__avatar">{initials}</div>;
}

// Lightweight relative time: today/yesterday/N days ago. Uses Intl
// RelativeTimeFormat under the hood for proper en/ar phrasing.
function relativeTime(
  iso: string,
  locale: string,
  t: (k: string, opts?: Record<string, unknown>) => string
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  const diffHr = Math.round(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return t('dashboard.activity.justNow');
  if (diffMin < 60) return formatRel(-diffMin, 'minute', locale);
  if (diffHr < 24) return formatRel(-diffHr, 'hour', locale);
  if (diffDay < 7) return formatRel(-diffDay, 'day', locale);
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(date);
}

function formatRel(value: number, unit: Intl.RelativeTimeFormatUnit, locale: string): string {
  try {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(value, unit);
  } catch {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(value, unit);
  }
}
