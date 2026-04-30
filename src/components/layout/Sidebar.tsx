import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  Target,
  Users,
  GraduationCap,
  Coins,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/features/household/hooks/useHousehold';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import './Sidebar.css';

type NavItem = { to: string; key: string; Icon: LucideIcon; adminOnly?: boolean };

const NAV: NavItem[] = [
  { to: '/', key: 'nav.dashboard', Icon: LayoutDashboard },
  { to: '/income', key: 'nav.income', Icon: Wallet, adminOnly: true },
  { to: '/expenses', key: 'nav.expenses', Icon: Receipt },
  { to: '/goals', key: 'nav.goals', Icon: Target },
  { to: '/family', key: 'nav.family', Icon: Users },
  { to: '/education', key: 'nav.education', Icon: GraduationCap },
];

export function Sidebar() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { member } = useHousehold();
  const isAdmin = member?.role === 'Admin';

  const visible = NAV.filter((n) => !n.adminOnly || isAdmin);

  return (
    <aside className="fl-sidebar">
      <div className="fl-sidebar__brand">
        <span className="fl-sidebar__logo" aria-hidden>
          <Coins size={22} strokeWidth={2} />
        </span>
        <span>{t('app.name')}</span>
      </div>

      <nav className="fl-sidebar__nav">
        {visible.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              ['fl-sidebar__link', isActive ? 'is-active' : ''].join(' ')
            }
          >
            <span className="fl-sidebar__icon" aria-hidden>
              <item.Icon size={18} strokeWidth={2} />
            </span>
            <span>{t(item.key)}</span>
          </NavLink>
        ))}
      </nav>

      <div className="fl-sidebar__footer">
        <LanguageToggle />
        <div className="fl-sidebar__user">
          <div className="fl-sidebar__avatar">{user?.email?.[0]?.toUpperCase() ?? '?'}</div>
          <div className="fl-sidebar__user-meta">
            <div className="fl-sidebar__user-email">{user?.email}</div>
            <button className="fl-sidebar__signout" onClick={signOut}>
              {t('nav.signOut')}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
