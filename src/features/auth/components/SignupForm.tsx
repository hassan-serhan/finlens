import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { signUp } from '../api/authApi';

export function SignupForm() {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName.trim()) {
      setError(t('auth.errors.missingName'));
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError(t('auth.errors.invalidEmail'));
      return;
    }
    if (password.length < 8) {
      setError(t('auth.errors.shortPassword'));
      return;
    }

    setLoading(true);
    try {
      await signUp({ email, password, fullName });
      setSuccess(t('auth.success.checkEmail'));
    } catch {
      setError(t('auth.errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input
          name="fullName"
          autoComplete="name"
          label={t('common.name')}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <Input
          name="email"
          type="email"
          autoComplete="email"
          label={t('common.email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          name="password"
          type="password"
          autoComplete="new-password"
          label={t('common.password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && (
          <div role="alert" style={{ color: 'var(--color-error)', font: 'var(--text-body-md)' }}>
            {error}
          </div>
        )}
        {success && (
          <div role="status" style={{ color: 'var(--color-primary)', font: 'var(--text-body-md)' }}>
            {success}
          </div>
        )}
        <Button type="submit" fullWidth loading={loading}>
          {t('auth.signup.submit')}
        </Button>
      </div>
    </form>
  );
}
