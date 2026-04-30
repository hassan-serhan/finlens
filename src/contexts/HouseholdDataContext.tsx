import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { listCategories } from '@/features/budgets/api/budgetsApi';
import { listMembers } from '@/features/family/api/familyApi';
import { useHousehold } from '@/features/household/hooks/useHousehold';
import type { Category, FamilyMember } from '@/types/db';

type HouseholdData = {
  categories: Category[];
  members: FamilyMember[];
  categoriesById: Record<string, Category>;
  membersById: Record<string, FamilyMember>;
  loading: boolean;
  refresh: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshMembers: () => Promise<void>;
};

const HouseholdDataContext = createContext<HouseholdData | undefined>(undefined);

// One-shot loader for categories + members per household. Other components
// read from this instead of calling listCategories / listMembers themselves,
// so the page only fires those queries once instead of 3-4 times.
export function HouseholdDataProvider({ children }: { children: ReactNode }) {
  const { householdId } = useHousehold();
  const [categories, setCategories] = useState<Category[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const lastHh = useRef<string | null>(null);

  const refreshCategories = useCallback(async () => {
    if (!householdId) return;
    setCategories(await listCategories(householdId));
  }, [householdId]);

  const refreshMembers = useCallback(async () => {
    if (!householdId) return;
    setMembers(await listMembers(householdId));
  }, [householdId]);

  const refresh = useCallback(async () => {
    if (!householdId) return;
    setLoading(true);
    try {
      const [cats, mems] = await Promise.all([
        listCategories(householdId),
        listMembers(householdId),
      ]);
      setCategories(cats);
      setMembers(mems);
    } finally {
      setLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    if (!householdId || householdId === lastHh.current) return;
    lastHh.current = householdId;
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [householdId]);

  const value = useMemo<HouseholdData>(
    () => ({
      categories,
      members,
      categoriesById: Object.fromEntries(categories.map((c) => [c.id, c])),
      membersById: Object.fromEntries(members.map((m) => [m.id, m])),
      loading,
      refresh,
      refreshCategories,
      refreshMembers,
    }),
    [categories, members, loading, refresh, refreshCategories, refreshMembers]
  );

  return (
    <HouseholdDataContext.Provider value={value}>{children}</HouseholdDataContext.Provider>
  );
}

export function useHouseholdData() {
  const ctx = useContext(HouseholdDataContext);
  if (!ctx) throw new Error('useHouseholdData must be used inside HouseholdDataProvider');
  return ctx;
}
