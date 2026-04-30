import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { isRtl, type AppLanguage } from '@/i18n';

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (lng: AppLanguage) => void;
  toggleLanguage: () => void;
  dir: 'ltr' | 'rtl';
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<AppLanguage>(
    (i18n.resolvedLanguage as AppLanguage) ?? 'en'
  );

  useEffect(() => {
    const html = document.documentElement;
    html.lang = language;
    html.dir = isRtl(language) ? 'rtl' : 'ltr';
  }, [language]);

  const setLanguage = (lng: AppLanguage) => {
    void i18n.changeLanguage(lng);
    setLanguageState(lng);
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      toggleLanguage: () => setLanguage(language === 'en' ? 'ar' : 'en'),
      dir: isRtl(language) ? 'rtl' : 'ltr',
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}
