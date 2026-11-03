import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CircleUserRound, List, Settings, LayoutDashboard, LogOut, MessageSquare } from 'lucide-react';
import MyNotes from '../components/MyNotes';
import { useAuth } from '../context/AuthContext';
import { readStored, writeStored } from '../utils/browserStorage';

export default function AccountPage() {
  const { user, username, logout } = useAuth();
  const { hash } = useLocation();
  const key = `sellipi-profile-${username}`;
  const [tab, setTab] = useState<'details' | 'settings' | 'notes'>(hash === '#notes' && user?.role === 'academic' ? 'notes' : 'details');
  const [name, setName] = useState(() => readStored(key, { name: username ?? '' }).name);
  const [message, setMessage] = useState('');
  function save(event: FormEvent) {
    event.preventDefault();
    setMessage(writeStored(key, { name }) ? 'Display name saved on this device.' : 'Your browser could not save this change.');
  }
  return <main className="account-page"><div className="breadcrumbs"><div className="wide-content"><Link to="/">Home</Link><span>›</span>My Account</div></div><div className="account-layout"><aside className="account-sidebar"><div className="account-profile"><CircleUserRound /><p>{name || username}</p><span className="account-role">{user?.role === 'user' ? 'Normal User' : user?.role}</span></div><button onClick={() => setTab('details')} className={tab === 'details' ? 'selected' : ''}>Account Details<List /></button>{user?.role === 'academic' && <button onClick={() => setTab('notes')} className={tab === 'notes' ? 'selected' : ''}>My Notes<MessageSquare /></button>}<button onClick={() => setTab('settings')} className={tab === 'settings' ? 'selected' : ''}>Settings<Settings /></button></aside><div className="account-body">
    {tab === 'details' && <section><h1>Account Details</h1><p>Username: {username}</p><p>Email: {user?.email}</p>{user?.institution && <p>Institution: {user.institution}</p>}<form className="account-form" onSubmit={save}><label htmlFor="display-name">Display name on this device</label><input id="display-name" value={name} onChange={event => setName(event.target.value)} required maxLength={100} /><button className="primary-button">Save Details</button><p role="status">{message}</p></form>{user?.role === 'admin' && <Link to="/admin" className="text-link"><LayoutDashboard />Admin Dashboard</Link>}{user?.role === 'academic' && <p>Open an inscription to submit a note for admin approval.</p>}</section>}
    {tab === 'notes' && user?.role === 'academic' && <MyNotes />}
    {tab === 'settings' && <section><h1>Settings</h1><p>Bookmarks are stored in this browser. Academic notes are stored in your account and require admin approval before publication.</p><button className="primary-button" onClick={logout}><LogOut />Sign Out</button></section>}
  </div></div></main>;
}
