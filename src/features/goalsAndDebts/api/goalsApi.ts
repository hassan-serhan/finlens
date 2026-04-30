import { supabase } from '@/lib/supabase';
import { adjustAccountBalance, getAccountByKind } from '@/features/accounts/api/accountsApi';
import { chargeWallet } from '@/features/wallet/api/walletApi';
import { InsufficientFundsError } from '@/lib/errors';
import type { FamilyMember, GoalContribution, Priority, SavingsGoal } from '@/types/db';

export async function listGoals(householdId: string): Promise<SavingsGoal[]> {
  const { data, error } = await supabase
    .from('savings_goals')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as SavingsGoal[];
}

export type AddGoalInput = {
  name: string;
  description?: string | null;
  target: number;
  due_date?: string | null;
  icon?: string | null;
  priority: Priority;
  owner_member_id?: string | null;
};

export async function addGoal(householdId: string, input: AddGoalInput): Promise<SavingsGoal> {
  const { data, error } = await supabase
    .from('savings_goals')
    .insert({
      household_id: householdId,
      name: input.name,
      description: input.description ?? null,
      target: input.target,
      saved: 0,
      due_date: input.due_date ?? null,
      icon: input.icon ?? '🎯',
      priority: input.priority,
      owner_member_id: input.owner_member_id ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as SavingsGoal;
}

export async function deleteGoal(goalId: string): Promise<void> {
  const { error } = await supabase.from('savings_goals').delete().eq('id', goalId);
  if (error) throw error;
}

export async function listGoalContributions(goalId: string): Promise<GoalContribution[]> {
  const { data, error } = await supabase
    .from('goal_contributions')
    .select('*')
    .eq('goal_id', goalId)
    .order('contributed_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as GoalContribution[];
}

// All contributions in the household in a date range — used for the
// "this month's contributions" tile + popup.
export async function listHouseholdContributions(
  householdId: string,
  sinceISO: string
): Promise<GoalContribution[]> {
  const goals = await listGoals(householdId);
  if (goals.length === 0) return [];
  const goalIds = goals.map((g) => g.id);
  const { data, error } = await supabase
    .from('goal_contributions')
    .select('*')
    .in('goal_id', goalIds)
    .gte('contributed_at', sinceISO)
    .order('contributed_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as GoalContribution[];
}

// A goal contribution always credits the Savings account + the goal's own
// `saved`, but the SOURCE of the money depends on who's contributing:
//   - Admin: debited from the Main account.
//   - Member: debited from their wallet.
// In both cases we pre-check the source balance and throw
// InsufficientFundsError before mutating anything else.
export async function contributeToGoal(params: {
  goal: SavingsGoal;
  amount: number;
  member: FamilyMember;
  contributedAt: string;
}): Promise<void> {
  const { goal, amount, member, contributedAt } = params;
  const isAdmin = member.role === 'Admin';

  if (isAdmin) {
    const main = await getAccountByKind(goal.household_id, 'main');
    const available = main ? Number(main.balance) : 0;
    if (amount > available) throw new InsufficientFundsError('main', available, amount);
    await adjustAccountBalance(main!.id, main!.balance, -amount);
  } else {
    // chargeWallet does its own InsufficientFundsError check.
    await chargeWallet({
      member,
      amount,
      reason: `Goal: ${goal.name}`,
      entryDate: contributedAt,
    });
  }

  const savings = await getAccountByKind(goal.household_id, 'savings');
  if (savings) {
    await adjustAccountBalance(savings.id, savings.balance, amount);
  }

  const { error: insErr } = await supabase.from('goal_contributions').insert({
    goal_id: goal.id,
    member_id: member.id,
    amount,
    contributed_at: contributedAt,
  });
  if (insErr) throw insErr;

  const nextSaved = +(Number(goal.saved) + amount).toFixed(2);
  const { error: updErr } = await supabase
    .from('savings_goals')
    .update({ saved: nextSaved })
    .eq('id', goal.id);
  if (updErr) throw updErr;
}
