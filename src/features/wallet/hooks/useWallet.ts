import { useCallback, useEffect, useState } from 'react';
import { getOrCreateWallet, listWalletEntries } from '../api/walletApi';
import type { AllowanceEntry, AllowanceWallet, FamilyMember } from '@/types/db';

type State = {
  wallet: AllowanceWallet | null;
  recent: AllowanceEntry[]; // last 2
  loading: boolean;
  reload: () => Promise<void>;
};

// Loads the member's wallet + 2 most recent entries. Used by WalletCard.
export function useWallet(member: FamilyMember | null): State {
  const [wallet, setWallet] = useState<AllowanceWallet | null>(null);
  const [recent, setRecent] = useState<AllowanceEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!member) { setWallet(null); setRecent([]); setLoading(false); return; }
    setLoading(true);
    const w = await getOrCreateWallet(member);
    const entries = await listWalletEntries(w.id, 2);
    setWallet(w);
    setRecent(entries);
    setLoading(false);
  }, [member]);

  useEffect(() => {
    void load();
  }, [load]);

  return { wallet, recent, loading, reload: load };
}
