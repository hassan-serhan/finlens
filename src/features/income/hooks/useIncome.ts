import { useCallback, useEffect, useState } from 'react';
import { addIncome, deleteIncome, listIncomeForCurrentMonth } from '../api/incomeApi';
import type { IncomeSource } from '@/types/db';

const PALETTE = ['#25D366', '#4D8DE5', '#F0B429', '#A78BFA', '#14B8A6', '#E5484D', '#0E5C2C'];

export function useIncome(householdId: string, createdBy: string | null = null) {
  const [items, setItems] = useState<IncomeSource[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setItems(await listIncomeForCurrentMonth(householdId));
    setLoading(false);
  }, [householdId]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = useCallback(
    async (input: { source: string; description: string; amount: number; income_date: string }) => {
      const color = PALETTE[items.length % PALETTE.length];
      await addIncome(householdId, { ...input, color, created_by: createdBy });
      await load();
    },
    [householdId, items.length, createdBy, load]
  );

  const remove = useCallback(
    async (i: IncomeSource) => {
      await deleteIncome(i);
      await load();
    },
    [load]
  );

  const total = items.reduce((s, i) => s + Number(i.amount), 0);

  return { items, total, loading, create, remove, reload: load };
}
