import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useHousehold } from '@/features/household/hooks/useHousehold';

// Gates admin-only routes (e.g. Income & Accounts).
// Members get bounced back to the dashboard.
export function AdminRoute({ children }: { children: ReactNode }) {
  const { member, loading } = useHousehold();

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}>
        Loading…
      </div>
    );
  }

  if (member?.role !== 'Admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
