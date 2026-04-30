import { useState } from 'react';
import { useTranslation } from 'react-i18next';

type Role = 'Admin' | 'Member';

const PERM_KEYS = [
  'viewExpenses',
  'addExpenses',
  'viewGoals',
  'contributeGoals',
  'viewIncome',
  'manageIncome',
  'manageMembers',
] as const;
type PermKey = (typeof PERM_KEYS)[number];

const PERMS: Record<Role, Record<PermKey, boolean>> = {
  Admin:  { viewExpenses: true, addExpenses: true, viewGoals: true, contributeGoals: true, viewIncome: true,  manageIncome: true,  manageMembers: true  },
  Member: { viewExpenses: true, addExpenses: true, viewGoals: true, contributeGoals: true, viewIncome: false, manageIncome: false, manageMembers: false },
};

export function PermissionsCard() {
  const { t } = useTranslation();
  const [active, setActive] = useState<Role>('Admin');

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">{t('family.perms.title')}</div>
          <div className="card-sub">{t('family.perms.subtitle')}</div>
        </div>
        <div className="tab-bar">
          {(['Admin', 'Member'] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              className={['tab-btn', active === r ? 'active' : ''].join(' ')}
              onClick={() => setActive(r)}
            >
              {t(`family.perms.role.${r}`)}
            </button>
          ))}
        </div>
      </div>
      <div className="perm-grid">
        {PERM_KEYS.map((key) => {
          const enabled = PERMS[active][key];
          return (
            <div key={key} className="perm-row">
              <div className="row" style={{ gap: 12 }}>
                <div
                  className="perm-row__icon"
                  style={{ color: enabled ? 'var(--primary)' : 'var(--neutral-400)' }}
                >
                  {enabled ? '✓' : '🔒'}
                </div>
                <span style={{ fontWeight: 600, fontSize: 13.5 }}>
                  {t(`family.perms.label.${key}`)}
                </span>
              </div>
              <div className={['toggle', enabled ? 'toggle--on' : ''].join(' ')} aria-hidden />
            </div>
          );
        })}
      </div>
    </div>
  );
}
