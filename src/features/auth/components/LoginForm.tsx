import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { signIn } from '../api/authApi';

export function LoginForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

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
      await signIn({ email, password });
      navigate('/', { replace: true });
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
          autoComplete="current-password"
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
        <Button type="submit" fullWidth loading={loading}>
          {t('auth.login.submit')}
        </Button>
      </div>
    </form>
  );
}
