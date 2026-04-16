import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, BarChart3, LogOut, BrainCircuit } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">
        <BrainCircuit size={28} />
        AI Interviewer
      </Link>
      <div className="navbar-nav">
        <Link
          to="/dashboard"
          className={`navbar-link ${isActive('/dashboard') ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </Link>
        <Link
          to="/analytics"
          className={`navbar-link ${isActive('/analytics') ? 'active' : ''}`}
        >
          <BarChart3 size={18} />
          Analytics
        </Link>
      </div>
      <div className="navbar-user">
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {user?.fullName || user?.email}
        </span>
        <div className="navbar-avatar">
          {(user?.fullName || user?.email || 'U').charAt(0).toUpperCase()}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={logout} title="Logout">
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  );
}
