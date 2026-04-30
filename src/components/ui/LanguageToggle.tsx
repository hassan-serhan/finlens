import { useLanguage } from '@/contexts/LanguageContext';
import './LanguageToggle.css';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="fl-lang" role="group" aria-label="Language">
      <button
        type="button"
        className={['fl-lang__btn', language === 'en' ? 'is-active' : ''].join(' ')}
        onClick={() => setLanguage('en')}
      >
        EN
      </button>
      <button
        type="button"
        className={['fl-lang__btn', language === 'ar' ? 'is-active' : ''].join(' ')}
        onClick={() => setLanguage('ar')}
      >
        العربية
      </button>
    </div>
  );
}
