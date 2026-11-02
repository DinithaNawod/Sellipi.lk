import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CircleUserRound, List, Settings, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { readStored, writeStored } from '../utils/browserStorage';

export default function AccountPage() {
  const { username, logout } = useAuth();
  const key = `sellipi-profile-${username}`;
  const [tab, setTab] = useState<'details' | 'settings' | null>(null);
  const [name, setName] = useState(() => readStored(key, { name: username ?? '' }).name);
  const [message, setMessage] = useState('');
  function save(event: FormEvent) {
    event.preventDefault();
    setMessage(writeStored(key, { name }) ? 'Display name saved on this device.' : 'Your browser could not save this change.');
  }
  return <main className="account-page"><div className="breadcrumbs"><div className="wide-content"><Link to="/">Home</Link><span>›</span>My Account</div></div><div className="account-layout"><aside className="account-sidebar"><div className="account-profile"><CircleUserRound /><p>{name || username}</p></div><button onClick={() => setTab('details')} className={tab === 'details' ? 'selected' : ''}>Account Details<List /></button><button onClick={() => setTab('settings')} className={tab === 'settings' ? 'selected' : ''}>Settings<Settings /></button></aside><div className="account-body">
    {tab === 'details' && <section><h1>Account Details</h1><p>Username: {username}</p><form className="account-form" onSubmit={save}><label htmlFor="display-name">Display name on this device</label><input id="display-name" value={name} onChange={event => setName(event.target.value)} required maxLength={100} /><button className="primary-button">Save Details</button><p role="status">{message}</p></form><Link to="/admin" className="text-link"><LayoutDashboard />Manage Inscriptions</Link></section>}
    {tab === 'settings' && <section><h1>Settings</h1><p>Bookmarks and inscription notes are stored in this browser.</p><button className="primary-button" onClick={logout}><LogOut />Sign Out</button></section>}
  </div></div></main>;
}
