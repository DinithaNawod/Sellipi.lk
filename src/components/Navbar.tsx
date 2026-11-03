import { useSiteContent } from '../context/SiteContentContext';
import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Mail, PhoneCall, Bell, CircleUserRound, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const navigation = [
  { label: 'Home', to: '/' },
  { label: 'Introduction to Inscription', to: '/introduction' },
  { label: 'Find Inscriptions', to: '/inscriptions' },
  { label: 'Translate', to: '/translate' },
  { label: 'About Us', to: '/about' },
  { label: 'Our Services', to: '/services' },
  { label: 'Contact Us', to: '/contact' },
];

export default function Navbar() {
  const { t, value } = useSiteContent();
  const { isAuthenticated, username, logout, user } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  return <header className="site-header">
    <div className="masthead">
      <Link to="/" className="masthead-curve" aria-label="Inscription Sri Lanka home" />
      <div className="masthead-inner">
        <div className="language-links"><span lang="si">{t("සිංහල")}</span><span aria-current="true">{t("English")}</span></div>
        <div className="masthead-contact">
          <a href={`mailto:${value('contact_email')}`}><Mail aria-hidden="true" />{value('contact_email')}</a>
          <a href={`tel:${value('contact_dial')}`}><PhoneCall aria-hidden="true" />{value('contact_phone')}</a>
        </div>
      </div>
    </div>
    <div className="navigation-bar">
      <button className="mobile-menu icon-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}>{menuOpen ? <X /> : <Menu />}</button>
      <nav aria-label="Main navigation" className={menuOpen ? 'main-navigation is-open' : 'main-navigation'}>
        {navigation.map(item => <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive || (item.to === '/inscriptions' && pathname.startsWith('/inscription/')) ? 'active' : ''}>{t(item.label)}</NavLink>)}
        {isAuthenticated && user?.role === 'admin' && <NavLink to="/admin" onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}>{t("Dashboard")}</NavLink>}
      </nav>
      <div className="navigation-account">
        <div className="notification-control">
          <button className="icon-button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(!notificationsOpen)}><Bell fill="currentColor" /></button>
          {notificationsOpen && <div className="notification-popover" role="status">{t("You have no new notifications.")}</div>}
        </div>
        <Link to={isAuthenticated ? user?.role === 'admin' ? '/admin' : '/account' : '/admin/login'} className="account-link"><CircleUserRound fill="currentColor" className="account-icon" /><span>{isAuthenticated ? `Hi, ${username}` : 'Sign In'}</span></Link>
        {isAuthenticated && <button className="icon-button logout-button" onClick={logout} aria-label="Sign out"><LogOut /></button>}
      </div>
    </div>
  </header>;
}
