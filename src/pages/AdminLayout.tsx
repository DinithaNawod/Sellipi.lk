import { NavLink, Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, UsersRound, MessagesSquare, LibraryBig, ArrowUpRight, ShieldCheck, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
export default function AdminLayout() {
  const { username } = useAuth();
  return <main className="admin-workspace"><aside className="admin-sidebar"><div className="admin-brand"><ShieldCheck /><div>Sellipi.lk<span>ADMINISTRATION</span></div></div><nav aria-label="Admin navigation"><NavLink to="/admin" end><LayoutDashboard />Overview</NavLink><NavLink to="/admin/users"><UsersRound />User Management</NavLink><NavLink to="/admin/notes"><MessagesSquare />Note Reviews</NavLink><NavLink to="/admin/content"><Settings />Site Content</NavLink><NavLink to="/admin/inscriptions"><LibraryBig />Inscriptions</NavLink></nav><div className="admin-sidebar-bottom"><span>Signed in as</span><strong>{username}</strong><Link to="/inscriptions">View Public Archive<ArrowUpRight /></Link></div></aside><div className="admin-main"><header className="admin-topbar"><span>Heritage archive management</span><Link to="/account">My Account</Link></header><div className="admin-page-content"><Outlet /></div></div></main>;
}
