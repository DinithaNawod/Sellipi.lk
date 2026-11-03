import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import { fetchUsers, updateUserAccess, getApiErrorMessage } from '../services/api';
import type { SessionUser, PageInfo } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PageControls from '../components/PageControls';
import ReviewDialog from '../components/ReviewDialog';
import { formatDate } from '../utils/formatters';
export default function AdminUsers() {
  const { user: current } = useAuth();
  const [params] = useSearchParams();
  const [query, setQuery] = useState({ search: '', role: params.get('role') === 'academic' ? 'academic' : '', status: '', page: 1 });
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<SessionUser[]>([]);
  const [pagination, setPagination] = useState<PageInfo>({ page: 1, pages: 0, limit: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<SessionUser | null>(null);
  const [role, setRole] = useState<'user' | 'academic'>('user');
  const [status, setStatus] = useState<'active' | 'suspended'>('active');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [profile, setProfile] = useState({ username: '', email: '', institution: '' });
  useEffect(() => {
    let active = true;
    fetchUsers(query).then(value => { if (active) { setUsers(value.users); setPagination(value.pagination); setError(''); } }).catch(err => { if (active) setError(getApiErrorMessage(err)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [query, revision]);
  function refresh() { setLoading(true); setRevision(value => value + 1); }
  async function save(event: FormEvent) {
    event.preventDefault(); if (!selected) return;
    setBusy(true); setFormError('');
    try { await updateUserAccess(selected.id, { role, status, ...profile }); setSelected(null); setMessage('User details and access updated. The changes apply to their next API request.'); refresh(); }
    catch (err) { setFormError(getApiErrorMessage(err)); }
    finally { setBusy(false); }
  }
  return <section><div className="section-heading"><div><p className="admin-eyebrow">COMMUNITY</p><h1>User Management</h1><p>Manage normal users, academic contributors, and account access.</p></div><button className="secondary-button" onClick={refresh}>Refresh</button></div><form className="management-filters" onSubmit={event => { event.preventDefault(); setLoading(true); setQuery(value => ({ ...value, search, page: 1 })); }}><label className="management-search"><Search /><input aria-label="Search users" placeholder="Search by name or email" value={search} maxLength={100} onChange={event => setSearch(event.target.value)} /></label><select aria-label="Filter by user role" value={query.role} onChange={event => { setLoading(true); setQuery(value => ({ ...value, role: event.target.value, page: 1 })); }}><option value="">All Roles</option><option value="user">Normal Users</option><option value="academic">Academics</option><option value="admin">Administrators</option></select><select aria-label="Filter by user status" value={query.status} onChange={event => { setLoading(true); setQuery(value => ({ ...value, status: event.target.value, page: 1 })); }}><option value="">All Statuses</option><option value="active">Active</option><option value="suspended">Suspended</option></select><button className="primary-button">Search</button></form>{message && <p className="note-success" role="status">{message}</p>}<div className="management-panel management-table-panel">{loading ? <p className="management-empty" role="status">Loading users…</p> : error ? <p className="inline-alert" role="alert">{error}</p> : <><div className="management-table-scroll"><table className="management-table"><thead><tr><th>User</th><th>Role</th><th>Institution</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead><tbody>{users.map(user => <tr key={user.id}><td><strong>{user.username}</strong><small>{user.email}</small></td><td><span className={`role-badge ${user.role}`}>{user.role === 'user' ? 'Normal User' : user.role}</span></td><td>{user.institution || '—'}</td><td><span className={`status-badge ${user.status}`}>{user.status}</span></td><td>{formatDate(user.createdAt || '') || '—'}</td><td>{user.role === 'admin' || user.id === current?.id ? <span className="protected-account">Protected administrator</span> : <button className="manage-user-button" onClick={() => { setSelected(user); setProfile({ username: user.username, email: user.email, institution: user.institution || '' }); setRole(user.role as 'user' | 'academic'); setStatus(user.status); setFormError(''); }}><SlidersHorizontal />Manage</button>}</td></tr>)}</tbody></table>{!users.length && <p className="management-empty">No users match these filters.</p>}</div><PageControls page={query.page} pages={pagination.pages} total={pagination.total} onChange={page => { setLoading(true); setQuery(value => ({ ...value, page })); }} /></>}</div>
  {selected && <ReviewDialog title="Manage User Access" onClose={() => setSelected(null)} busy={busy}><p><strong>{selected.username}</strong><br />{selected.email}</p><form onSubmit={save}><label>Username<input required maxLength={100} value={profile.username} disabled={busy} onChange={event => setProfile(current => ({ ...current, username: event.target.value }))} /></label><label>Email Address<input required type="email" maxLength={254} value={profile.email} disabled={busy} onChange={event => setProfile(current => ({ ...current, email: event.target.value }))} /></label><label>University / Institution<input maxLength={200} value={profile.institution} disabled={busy} onChange={event => setProfile(current => ({ ...current, institution: event.target.value }))} /></label><label>Account Role<select value={role} disabled={busy} onChange={event => setRole(event.target.value as 'user' | 'academic')}><option value="user">Normal User</option><option value="academic">Academic</option></select></label><label>Account Status<select value={status} disabled={busy} onChange={event => setStatus(event.target.value as 'active' | 'suspended')}><option value="active">Active</option><option value="suspended">Suspended</option></select></label><p className="dialog-explanation">Suspended users cannot use their account. Normal users cannot submit notes. Existing approved notes can be unpublished from Note Reviews.</p>{formError && <p role="alert" className="form-error">{formError}</p>}<div className="dialog-actions"><button type="button" className="secondary-button" disabled={busy} onClick={() => setSelected(null)}>Cancel</button><button className="primary-button" disabled={busy}>{busy ? 'Saving…' : 'Save Access'}</button></div></form></ReviewDialog>}
  </section>;
}
