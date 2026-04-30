import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { inviteMember } from '../api/familyApi';

type Props = {
  open: boolean;
  onClose: () => void;
  onInvited: () => void;
};

export function InviteMemberModal({ open, onClose, onInvited }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Admin' | 'Member'>('Member');
  const [relation, setRelation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setEmail('');
      setPassword('');
      setRole('Member');
      setRelation('');
      setError(null);
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError(t('family.invite.errors.name'));
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError(t('family.invite.errors.email'));
    if (password.length < 8) return setError(t('family.invite.errors.password'));

    setBusy(true);
    try {
      await inviteMember({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        relation: relation.trim() || undefined,
      });
      onInvited();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('family.invite.errors.generic'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title={t('family.invite.title')}
      subtitle={t('family.invite.subtitle')}
      onClose={onClose}
    >
      <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
        <div className="field">
          <label htmlFor="inv-name">{t('common.name')}</label>
          <input
            id="inv-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Yara"
            autoFocus
          />
        </div>
        <div className="field">
          <label htmlFor="inv-email">{t('common.email')}</label>
          <input
            id="inv-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
          />
        </div>
        <div className="field">
          <label htmlFor="inv-pw">{t('family.invite.password')}</label>
          <input
            id="inv-pw"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('family.invite.passwordPh')}
          />
          <span className="tiny muted">{t('family.invite.passwordHint')}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label htmlFor="inv-role">{t('family.invite.role')}</label>
            <select
              id="inv-role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'Admin' | 'Member')}
            >
              <option value="Member">{t('family.perms.role.Member')}</option>
              <option value="Admin">{t('family.perms.role.Admin')}</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="inv-rel">{t('family.invite.relation')}</label>
            <input
              id="inv-rel"
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              placeholder="Daughter, Son…"
            />
          </div>
        </div>

        {error && (
          <div role="alert" style={{ color: 'var(--danger)', fontSize: 13 }}>
            {error}
          </div>
        )}

        <div className="row" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button type="button" className="btn btn-outlined btn-sm" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
            {busy ? t('common.loading') : t('family.invite.submit')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
