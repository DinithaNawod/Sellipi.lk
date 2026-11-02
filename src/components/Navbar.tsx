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
  const { isAuthenticated, username, logout } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  return <header className="site-header">
    <div className="masthead">
      <Link to="/" className="masthead-curve" aria-label="Inscription Sri Lanka home" />
      <div className="masthead-inner">
        <div className="language-links"><span lang="si">සිංහල</span><span aria-current="true">English</span></div>
        <div className="masthead-contact">
          <a href="mailto:admin@sellipi.lk"><Mail aria-hidden="true" />admin@sellipi.lk</a>
          <a href="tel:+94112786200"><PhoneCall aria-hidden="true" />+94 11 2786200, +94 11 2784203-4</a>
        </div>
      </div>
    </div>
    <div className="navigation-bar">
      <button className="mobile-menu icon-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}>{menuOpen ? <X /> : <Menu />}</button>
      <nav aria-label="Main navigation" className={menuOpen ? 'main-navigation is-open' : 'main-navigation'}>
        {navigation.map(item => <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive || (item.to === '/inscriptions' && pathname.startsWith('/inscription/')) ? 'active' : ''}>{item.label}</NavLink>)}
      </nav>
      <div className="navigation-account">
        <div className="notification-control">
          <button className="icon-button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(!notificationsOpen)}><Bell fill="currentColor" /></button>
          {notificationsOpen && <div className="notification-popover" role="status">You have no new notifications.</div>}
        </div>
        <Link to={isAuthenticated ? '/account' : '/admin/login'} className="account-link"><CircleUserRound fill="currentColor" className="account-icon" /><span>{isAuthenticated ? `Hi, ${username}` : 'Sign In'}</span></Link>
        {isAuthenticated && <button className="icon-button logout-button" onClick={logout} aria-label="Sign out"><LogOut /></button>}
      </div>
    </div>
  </header>;
}
