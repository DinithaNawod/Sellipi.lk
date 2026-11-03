import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UsersRound, GraduationCap, MessagesSquare, LibraryBig, ArrowRight } from 'lucide-react';
import { fetchAdminStats, getApiErrorMessage } from '../services/api';
import type { AdminStats } from '../services/api';
export default function AdminOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    fetchAdminStats().then(value => { if (active) { setStats(value); setError(''); } }).catch(err => { if (active) setError(getApiErrorMessage(err)); });
    return () => { active = false; };
  }, [revision]);
  return <section><div className="section-heading"><div><p className="admin-eyebrow">ADMIN DASHBOARD</p><h1>Archive Overview</h1><p>Manage your community and review the knowledge they contribute.</p></div><button className="secondary-button" onClick={() => setRevision(value => value + 1)}>Refresh</button></div>{error ? <p className="inline-alert" role="alert">{error}</p> : !stats ? <p className="management-empty" role="status">Loading dashboard…</p> : <><div className="admin-stat-grid">{[
    { label: 'Total Users', value: stats.users, icon: UsersRound, to: '/admin/users', detail: `${stats.normalUsers} normal · ${stats.administrators} admins` },
    { label: 'Academics', value: stats.academics, icon: GraduationCap, to: '/admin/users?role=academic', detail: 'Academic contributor accounts' },
    { label: 'Pending Notes', value: stats.pending, icon: MessagesSquare, to: '/admin/notes', detail: 'Awaiting your review', highlight: true },
    { label: 'Inscriptions', value: stats.inscriptions, icon: LibraryBig, to: '/admin/inscriptions', detail: 'Records in the public archive' },
  ].map(({ label, value, icon: Icon, to, detail, highlight }) => <Link to={to} key={label} className={`admin-stat-card ${highlight ? 'highlight' : ''}`}><div><span>{label}</span><Icon /></div><strong>{value}</strong><small>{detail}</small></Link>)}</div><div className="admin-overview-grid"><section className="management-panel"><h2>Academic Note Reviews</h2><p>Every submitted note stays private until an administrator approves it.</p><div className="review-totals"><div><strong>{stats.pending}</strong><span>Pending</span></div><div><strong>{stats.approved}</strong><span>Published</span></div><div><strong>{stats.rejected}</strong><span>Rejected</span></div></div><Link to="/admin/notes" className="primary-button">Review Notes<ArrowRight /></Link></section><section className="management-panel"><h2>Community Access</h2><p>Normal users can explore the archive. Academics can submit notes. Administrators manage users, inscriptions, and publication decisions.</p><p className="suspended-count">{stats.suspended} suspended account{stats.suspended === 1 ? '' : 's'}</p><Link to="/admin/users" className="secondary-button">Manage Users<ArrowRight /></Link></section></div></>}</section>;
}
