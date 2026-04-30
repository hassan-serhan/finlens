import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Coins } from 'lucide-react';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import './AuthLayout.css';

export function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="fl-auth">
      <header className="fl-auth__header">
        <div className="fl-auth__brand">
          <span className="fl-auth__logo" aria-hidden><Coins size={24} strokeWidth={2} /></span>
          <span className="fl-auth__brand-name">{t('app.name')}</span>
        </div>
        <LanguageToggle />
      </header>

      <main className="fl-auth__main">
        <div className="fl-auth__hero">
          <h1 className="fl-auth__tagline">{t('app.tagline')}</h1>
        </div>
        <div className="fl-auth__panel">{children}</div>
      </main>
    </div>
  );
}
