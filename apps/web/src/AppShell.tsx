import { ReactNode, useEffect, useState } from 'react';

type Props = { email: string; offline: boolean; onLogout: () => void; children: ReactNode };
const destinations = [['Dashboard', '/'], ['Transactions & Inbox', '/transactions'], ['Wallets', '/wallets'], ['Budgets', '/budgets'], ['Financial Goals', '/goals'], ['Reconciliation', '/reconciliation'], ['Family & Settings', '/family']] as const;

export function AppShell({ email, offline, onLogout, children }: Props) {
  const [activeHref, setActiveHref] = useState(() => window.location.pathname);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [householdName, setHouseholdName] = useState(() => localStorage.getItem('arta.activeHouseholdName') || 'Active household');
  useEffect(() => {
    const targets: Array<[string, string]> = [['dashboard', '.app-shell'], ['wallets', '.layout-grid'], ['family', '[aria-labelledby="backup-restore-title"]']];
    for (const [id, selector] of targets) document.querySelector<HTMLElement>(`#${id}`) ?? document.querySelector<HTMLElement>(selector)?.setAttribute('id', id);
  }, [children]);
  useEffect(() => {
    const timer = window.setInterval(() => setHouseholdName(localStorage.getItem('arta.activeHouseholdName') || 'Active household'), 500);
    return () => window.clearInterval(timer);
  }, []);
  function navigate(href: string) { setActiveHref(href); if (href !== window.location.pathname) { window.history.pushState({}, '', href); window.dispatchEvent(new PopStateEvent('popstate')); } }
  function choose(href: string) { navigate(href); setMobileOpen(false); }
  return <div className="app-frame"><aside className="app-sidebar" aria-label="Primary navigation"><div className="brand-lockup"><span className="eyebrow">Arta</span><strong>Household money, remembered.</strong></div><div className="shell-household"><span className="muted">Active household</span><strong>{householdName}</strong><a href="/" onClick={(event) => { event.preventDefault(); navigate('/'); }}>Switch or manage</a></div><nav className="primary-nav">{destinations.map(([label, href]) => <a href={href} key={href} aria-current={activeHref === href ? 'page' : undefined} onClick={(event) => { event.preventDefault(); navigate(href); }}>{label}</a>)}</nav><div className="account-card"><span className="muted">Signed in as</span><strong>{email}</strong>{offline && <span className="offline-label">Offline mode</span>}<button type="button" className="secondary" onClick={onLogout}>Log out</button></div></aside><div className="app-main"><header className="mobile-header"><strong>Arta</strong><button type="button" className="secondary menu-button" aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)}>Menu</button>{mobileOpen && <nav className="mobile-nav">{destinations.map(([label, href]) => <a href={href} key={href} aria-current={activeHref === href ? 'page' : undefined} onClick={(event) => { event.preventDefault(); choose(href); }}>{label}</a>)}<span className="mobile-household">{householdName}</span><button type="button" className="secondary" onClick={onLogout}>Log out</button></nav>}</header>{children}</div></div>;
}
