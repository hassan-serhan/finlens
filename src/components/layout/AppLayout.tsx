import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import './AppLayout.css';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fl-app">
      <Sidebar />
      <main className="fl-app__main">{children}</main>
    </div>
  );
}
