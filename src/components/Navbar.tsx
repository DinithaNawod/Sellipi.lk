import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Phone, Bell, UserCircle, LogOut, ScrollText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Introduction to Inscription', to: '/#about' },
  { label: 'Find Inscriptions', to: '/inscriptions' },
  { label: 'Translate', to: '/translate' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, username, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 font-poppins">
      {/* Top info bar */}
      <div className="bg-maroon text-white text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-between">
          <div className="hidden sm:flex items-center gap-2 font-sinhala">
            <button className="opacity-80 hover:opacity-100 transition-opacity">සිංහල</button>
            <span className="opacity-50">/</span>
            <button className="font-bold">English</button>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <a href="mailto:admin@sellipi.lk" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
              <Mail className="w-3.5 h-3.5" />
              <span className="hidden md:inline">admin@sellipi.lk</span>
            </a>
            <a href="tel:+94112786200" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden md:inline">+94 11 2786200</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="bg-white border-t-[3px] border-maroon shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 text-maroon shrink-0">
            <ScrollText className="w-6 h-6" />
            <span className="font-display text-lg tracking-wide">Inscription Sri Lanka</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-5 overflow-x-auto">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className={`text-sm whitespace-nowrap transition-colors ${
                  pathname === link.to
                    ? 'text-maroon font-bold'
                    : 'text-stone-700 hover:text-maroon font-medium'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              title="Notifications"
              className="text-stone-500 hover:text-maroon transition-colors"
            >
              <Bell className="w-5 h-5" />
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link to="/admin" className="flex items-center gap-1.5 text-stone-700 hover:text-maroon transition-colors">
                  <UserCircle className="w-6 h-6" />
                  <span className="hidden sm:inline text-sm font-medium">Hi, {username}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="text-stone-400 hover:text-maroon transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link to="/admin/login" className="flex items-center gap-1.5 text-stone-700 hover:text-maroon transition-colors">
                <UserCircle className="w-6 h-6" />
                <span className="hidden sm:inline text-sm font-medium">Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
