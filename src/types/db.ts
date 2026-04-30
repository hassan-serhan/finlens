// Mirrors SUPABASE_SCHEMA.md. Keep in sync with the SQL migrations.

export type FamilyRole = 'Admin' | 'Member';
export type AccountKind = 'main' | 'savings';
export type AllowanceKind = 'credit' | 'debit';

export type Household = {
  id: string;
  name: string;
  created_by: string | null;
  created_at: string;
};

export type FamilyMember = {
  id: string;
  household_id: string;
  user_id: string | null;
  name: string;
  initials: string | null;
  relation: string | null;
  age: number | null;
  avatar: string | null;
  role: FamilyRole;
  xp: number;
  level: string | null;
  invite_status: string | null;
  created_at: string;
};

export type Account = {
  id: string;
  household_id: string;
  kind: AccountKind;
  name: string;
  sub: string | null;
  icon: string | null;
  last4: string | null;
  balance: number;
  tone: string | null;
  created_at: string;
};

export type IncomeSource = {
  id: string;
  household_id: string;
  source: string;
  description: string | null;
  amount: number;
  income_date: string;
  color: string | null;
  recurring: boolean;
  created_by: string | null;
  created_at: string;
};

export type Category = {
  id: string;
  household_id: string;
  slug: string;
  label: string;
  icon: string | null;
  color: string | null;
};

export type MonthlyBudget = {
  id: string;
  household_id: string;
  period_month: string;
  total: number;
};

export type CategoryBudget = {
  id: string;
  monthly_budget_id: string;
  category_id: string;
  amount: number;
};

export type AllowanceWallet = {
  id: string;
  member_id: string;
  household_id: string;
  balance: number;
  weekly_amount: number | null;
};

export type AllowanceEntry = {
  id: string;
  wallet_id: string;
  kind: AllowanceKind;
  amount: number;
  reason: string;
  approved_by: string | null;
  entry_date: string;
  created_at: string;
};

export type Priority = 'high' | 'medium' | 'low';

export type SavingsGoal = {
  id: string;
  household_id: string;
  name: string;
  description: string | null;
  target: number;
  saved: number;
  due_date: string | null;
  icon: string | null;
  tone: string | null;
  priority: Priority;
  owner_member_id: string | null;
  created_at: string;
};

export type GoalContribution = {
  id: string;
  goal_id: string;
  member_id: string | null;
  amount: number;
  contributed_at: string;
};

export type Debt = {
  id: string;
  household_id: string;
  name: string;
  description: string | null;
  total: number;
  paid: number;
  monthly_payment: number | null;
  interest_rate: number | null;
  payoff_date: string | null;
  icon: string | null;
  priority: Priority;
  created_at: string;
};

export type DebtPayment = {
  id: string;
  debt_id: string;
  member_id: string | null;
  amount: number;
  paid_at: string;
};

// Education

export type EduTopic = {
  id: string;
  title: string;
  sub: string | null;
  description: string | null;
  icon: string | null;
  color: string | null;
  bg: string | null;
  video_url: string | null;
  lesson_count: number;
  length_label: string | null;
  reward_amount: number;
  xp_reward: number;
  sort_order: number;
  created_at: string;
};

export type EduQuestion = {
  id: string;
  topic_id: string;
  position: number;
  question: string;
  options: string[];
  correct_index: number;
  created_at: string;
};

export type EduProgress = {
  member_id: string;
  topic_id: string;
  percent: number;
  best_score: number;
  total_questions: number;
  passed: boolean;
  completed_at: string | null;
  updated_at: string;
};

export type EduBadge = {
  id: string;
  member_id: string;
  topic_id: string;
  badge_name: string;
  earned_at: string;
};

export type EduHouseholdReward = {
  household_id: string;
  topic_id: string;
  reward_amount: number;
  updated_at: string;
};
