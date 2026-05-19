import { useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import {
  Bolt,
  LayoutDashboard,
  MailX,
  Mail,
  MailCheck,
  MessageSquareText,
  Palette,
  MailMinus,
} from 'lucide-react';
import { useMatch, useNavigate } from 'react-router-dom';

import { cn } from '@/lib/utils';
import { useScrolled } from '@/hooks/useScrolled';

const NAV_ITEMS = [
  { path: '/', match: '/', to: '/', icon: LayoutDashboard, label: __('Dashboard', 'flexa-unsubscribe') },
  { path: '/unsubscribes/*', to: '/unsubscribes', icon: MailX, label: __('Unsubscribes', 'flexa-unsubscribe') },
  { path: '/blocked/*', to: '/blocked', icon: Mail, label: __('Blocked', 'flexa-unsubscribe') },
  { path: '/resubscribed/*', to: '/resubscribed', icon: MailCheck, label: __('Re-subscribed', 'flexa-unsubscribe') },
  { path: '/reasons/*', to: '/reasons', icon: MessageSquareText, label: __('Reasons', 'flexa-unsubscribe') },
  { path: '/settings/*', to: '/settings', icon: Bolt, label: __('Settings', 'flexa-unsubscribe') },
  { path: '/appearance/*', to: '/appearance', icon: Palette, label: __('Appearance', 'flexa-unsubscribe') },
];

function NavItem({
  path,
  to,
  icon: Icon,
  label,
  onClick,
}: {
  path: string;
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  onClick: (to: string) => void;
}) {
  const isActive = !!useMatch(path);
  return (
    <button
      type="button"
      onClick={() => onClick(to)}
      className={cn(
        'flex cursor-pointer flex-row items-center gap-1.5 sm:flex-col md:flex-col lg:flex-row font-semibold h-full px-1 border-b-2 border-transparent text-muted-foreground hover:text-primary-accent hover:border-primary-accent transition-colors',
        isActive &&
          'text-primary border-primary hover:text-primary-accent hover:border-primary-accent',
      )}
    >
      <Icon className="size-5 shrink-0" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export default function Header() {
  const navigate = useNavigate();
  const scrolled = useScrolled();
  const handleNavClick = useCallback((to: string) => navigate(to), [navigate]);

  return (
    <header
      className={cn(
        'bg-background fixed z-40 flex h-[56px] w-full items-center justify-start pt-0 transition-shadow duration-300',
        scrolled ? 'top-0 shadow-[0_8px_8px_0_rgba(85,93,102,0.3)]' : 'top-[46px] shadow-none',
        'sm:top-[46px]',
        'md:top-8',
        'lg:left-[160px] lg:w-[calc(100%-160px)]',
      )}
    >
      {/* Logo / Brand */}
      <div className="border-border flex h-full items-center gap-3 border-r px-4">
        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg">
          <MailMinus className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-foreground text-sm font-semibold">Flexa Secure</span>
          <span className="text-muted-foreground text-[10px]">{__('Unsubscribe', 'flexa-unsubscribe')}</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex h-full items-center gap-5 pl-4 sm:gap-7">
        {NAV_ITEMS.map(({ path, to, icon, label }) => (
          <NavItem key={to} path={path} to={to} icon={icon} label={label} onClick={handleNavClick} />
        ))}
      </nav>
    </header>
  );
}
