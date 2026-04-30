import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { findMemberByUser } from '../api/householdApi';
import type { FamilyMember } from '@/types/db';

type HouseholdState = {
  loading: boolean;
  member: FamilyMember | null;
  householdId: string | null;
  error: string | null;
  refresh: () => void;
};

// Module-scope cache shared across every useHousehold consumer (pages,
// sidebar, route guard, HouseholdDataProvider). Without this, each instance
// fires its own findMemberByUser query on mount.
const memberCache = new Map<string, Promise<FamilyMember | null>>();

function loadMember(userId: string): Promise<FamilyMember | null> {
  let p = memberCache.get(userId);
  if (!p) {
    p = findMemberByUser(userId).catch((e) => {
      memberCache.delete(userId);
      throw e;
    });
    memberCache.set(userId, p);
  }
  return p;
}

// The household + admin family_member are created atomically by the
// `on_auth_user_created` Postgres trigger (see supabase/signup_trigger.sql).
// This hook just reads the existing member row.
export function useHousehold(): HouseholdState {
  const { user } = useAuth();
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!user) {
      setMember(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const tryLoad = async (attemptsLeft: number): Promise<void> => {
      try {
        const m = await loadMember(user.id);
        if (cancelled) return;
        if (m) {
          setMember(m);
          setError(null);
          setLoading(false);
          return;
        }
        // The trigger may not have committed yet right after signup.
        if (attemptsLeft > 0) {
          memberCache.delete(user.id);
          await new Promise((r) => setTimeout(r, 400));
          return tryLoad(attemptsLeft - 1);
        }
        setError('No family profile found. Please contact support.');
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load household');
        setLoading(false);
      }
    };

    void tryLoad(3);

    return () => {
      cancelled = true;
    };
  }, [user, tick]);

  return {
    loading,
    member,
    householdId: member?.household_id ?? null,
    error,
    refresh: () => {
      if (user) memberCache.delete(user.id);
      setTick((n) => n + 1);
    },
  };
}
