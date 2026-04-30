import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Card } from '@/components/ui/Card';
import { SignupForm } from '../components/SignupForm';

export function SignupPage() {
  const { t } = useTranslation();
  return (
    <AuthLayout>
      <Card>
        <h2 style={{ font: 'var(--text-headline-lg)', margin: '0 0 8px' }}>
          {t('auth.signup.title')}
        </h2>
        <p style={{ color: 'var(--color-on-surface-variant)', margin: '0 0 24px' }}>
          {t('auth.signup.subtitle')}
        </p>
        <SignupForm />
        <p style={{ marginTop: 20, font: 'var(--text-body-md)', color: 'var(--color-on-surface-variant)' }}>
          {t('auth.signup.haveAccount')} <Link to="/login">{t('auth.signup.signIn')}</Link>
        </p>
      </Card>
    </AuthLayout>
  );
}
