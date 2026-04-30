import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Card } from '@/components/ui/Card';
import { LoginForm } from '../components/LoginForm';

export function LoginPage() {
  const { t } = useTranslation();
  return (
    <AuthLayout>
      <Card>
        <h2 style={{ font: 'var(--text-headline-lg)', margin: '0 0 8px' }}>
          {t('auth.login.title')}
        </h2>
        <p style={{ color: 'var(--color-on-surface-variant)', margin: '0 0 24px' }}>
          {t('auth.login.subtitle')}
        </p>
        <LoginForm />
        <p style={{ marginTop: 20, font: 'var(--text-body-md)', color: 'var(--color-on-surface-variant)' }}>
          {t('auth.login.noAccount')}{' '}
          <Link to="/signup">{t('auth.login.createAccount')}</Link>
        </p>
      </Card>
    </AuthLayout>
  );
}
