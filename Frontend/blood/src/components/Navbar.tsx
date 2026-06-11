import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/Profileservice';
import type { Notification } from '../types/donor';

/* ─── icon helpers ─────────────────────────────────────────────────────────── */
const Icon = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  requests: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  notifications: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  history: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polyline points="12 8 12 12 14 14" /><path d="M3.05 11a9 9 0 1 0 .5-4" /><polyline points="3 3 3 7 7 7" />
    </svg>
  ),
  newRequest: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

/* ─── Sidebar NavItem ───────────────────────────────────────────────────────── */
const SideNavItem: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  active: boolean;
  onClick?: () => void;
}> = ({ to, icon, label, badge, active, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
      ${active
        ? 'bg-rose-600 text-white shadow-sm shadow-rose-200'
        : 'text-slate-500 hover:bg-rose-50 hover:text-rose-600'
      }`}
  >
    <span className={`flex-shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-rose-500'}`}>{icon}</span>
    <span className="flex-1">{label}</span>
    {badge != null && badge > 0 && (
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center
        ${active ? 'bg-white text-rose-600' : 'bg-rose-600 text-white'}`}>
        {badge > 9 ? '9+' : badge}
      </span>
    )}
  </Link>
);

/* ─── Main Navbar (Sidebar) ─────────────────────────────────────────────────── */
const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    if (!isAuthenticated) return;
    const load = async () => {
      try {
        const data = await notificationService.getAll();
        setNotifications(Array.isArray(data) ? data : []);
      } catch {}
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, location.pathname]);

  // Close mobile on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const dashLink = user?.role === 'donor' ? '/donor' : '/hospital';
  const isActive = (path: string) => location.pathname === path;

  const initials = user?.name
    ? user.name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-rose-600 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:bg-rose-700 transition-all">
            ✚
          </div>
          <span className="text-slate-900 font-bold text-lg tracking-tight">
            Blood<span className="text-rose-600">Connect</span>
          </span>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {isAuthenticated ? (
          <>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 mb-2">Main</p>
            <SideNavItem to={dashLink} icon={Icon.dashboard} label="Dashboard" active={isActive(dashLink)} />

            {user?.role === 'donor' && (
              <>
                <SideNavItem to="/donor/requests" icon={Icon.requests} label="Blood Requests" active={isActive('/donor/requests')} />
                <SideNavItem to="/donor/history" icon={Icon.history} label="Donation History" active={isActive('/donor/history')} />
              </>
            )}

            {user?.role === 'hospital' && (
              <>
                <SideNavItem to="/hospital/blood-request" icon={Icon.newRequest} label="New Request" active={isActive('/hospital/blood-request')} />
                <SideNavItem to="/hospital/history" icon={Icon.history} label="History" active={isActive('/hospital/history')} />
              </>
            )}

            <div className="pt-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 mb-2">Account</p>
              <SideNavItem to="/notifications" icon={Icon.notifications} label="Notifications" badge={unread} active={isActive('/notifications')} />
              <SideNavItem to="/profile" icon={Icon.profile} label="Profile" active={isActive('/profile')} />
            </div>
          </>
        ) : (
          <>
            <SideNavItem to="/login" icon={Icon.profile} label="Login" active={isActive('/login')} />
          </>
        )}
      </nav>

      {/* Bottom: user card + logout */}
      <div className="px-3 pb-5 mt-4">
        {isAuthenticated ? (
          <div className="bg-slate-50 rounded-2xl p-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-rose-100 rounded-xl flex items-center justify-center text-rose-700 font-bold text-sm flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              {Icon.logout}
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <Link
            to="/signup"
            className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all shadow-sm"
          >
            Get Started
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-60 bg-white border-r border-slate-100 shadow-sm z-40">
        {sidebarContent}
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 bg-white border-b border-slate-100 shadow-sm h-14 flex items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">✚</div>
          <span className="text-slate-900 font-bold text-base">Blood<span className="text-rose-600">Connect</span></span>
        </Link>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <Link to="/notifications" className="relative p-2">
              {Icon.notifications}
              <span className="absolute top-1 right-1 bg-rose-600 text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">{unread > 9 ? '9+' : unread}</span>
            </Link>
          )}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {mobileOpen ? Icon.close : Icon.menu}
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div
            ref={sidebarRef}
            className="md:hidden fixed inset-y-0 left-0 w-72 bg-white z-50 shadow-2xl overflow-y-auto"
          >
            <div className="h-14" />
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;
