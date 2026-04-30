import { supabase } from '@/lib/supabase';
import { firstOfMonthISO } from '@/lib/format';
import type { Category, CategoryBudget, MonthlyBudget } from '@/types/db';

export async function listCategories(householdId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('household_id', householdId)
    .order('label');
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function addCategory(
  householdId: string,
  input: Pick<Category, 'slug' | 'label' | 'icon' | 'color'>
): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert({ household_id: householdId, ...input })
    .select()
    .single();
  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

export async function getOrCreateCurrentMonthBudget(
  householdId: string
): Promise<MonthlyBudget> {
  const period = firstOfMonthISO();
  const { data: existing } = await supabase
    .from('monthly_budgets')
    .select('*')
    .eq('household_id', householdId)
    .eq('period_month', period)
    .maybeSingle();
  if (existing) return existing as MonthlyBudget;

  const { data, error } = await supabase
    .from('monthly_budgets')
    .insert({ household_id: householdId, period_month: period, total: 0 })
    .select()
    .single();
  if (error) throw error;
  return data as MonthlyBudget;
}

export async function setMonthlyTotal(budgetId: string, total: number): Promise<void> {
  const { error } = await supabase.from('monthly_budgets').update({ total }).eq('id', budgetId);
  if (error) throw error;
}

export async function listCategoryBudgets(budgetId: string): Promise<CategoryBudget[]> {
  const { data, error } = await supabase
    .from('category_budgets')
    .select('*')
    .eq('monthly_budget_id', budgetId);
  if (error) throw error;
  return (data ?? []) as CategoryBudget[];
}

export async function upsertCategoryBudget(
  budgetId: string,
  categoryId: string,
  amount: number
): Promise<void> {
  const { error } = await supabase
    .from('category_budgets')
    .upsert(
      { monthly_budget_id: budgetId, category_id: categoryId, amount },
      { onConflict: 'monthly_budget_id,category_id' }
    );
  if (error) throw error;
}
