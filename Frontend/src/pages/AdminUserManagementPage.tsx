import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminService, type AdminUser } from '../services/adminService';

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const cfg: Record<string, string> = {
    donor:    'bg-rose-100 text-rose-700 border-rose-200',
    hospital: 'bg-blue-100 text-blue-700 border-blue-200',
    admin:    'bg-purple-100 text-purple-700 border-purple-200',
  };
  const icons: Record<string, string> = { donor: '🩸', hospital: '🏥', admin: '🔑' };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${cfg[role] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {icons[role]} {role}
    </span>
  );
};

const AdminUserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filtered, setFiltered] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'donor' | 'hospital' | 'admin'>('all');
  const [actionId, setActionId] = useState<number | null>(null);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<{ user: AdminUser; password: string } | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = useCallback(async () => {
    try {
      const list = await adminService.getAllUsers();
      setUsers(Array.isArray(list) ? list : []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let out = users;
    if (roleFilter !== 'all') out = out.filter((u) => u.role === roleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    setFiltered(out);
  }, [users, search, roleFilter]);

  const handleToggle = async (user: AdminUser) => {
    setActionId(user.id);
    try {
      if (user.is_active) {
        await adminService.deactivateUser(user.id);
        showToast(`🔒 ${user.name} deactivated`);
      } else {
        await adminService.activateUser(user.id);
        showToast(`✅ ${user.name} activated`);
      }
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
    } catch (err: any) {
      showToast(err?.response?.data?.message || '❌ Action failed');
    } finally {
      setActionId(null);
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    setResetLoading(true);
    try {
      const result = await adminService.resetUserPassword(resetTarget.id);
      setTempPassword({ user: resetTarget, password: result.temp_password });
      setResetTarget(null);
    } catch (err: any) {
      showToast(err?.response?.data?.message || '❌ Failed to reset password');
      setResetTarget(null);
    } finally {
      setResetLoading(false);
    }
  };

  const counts = {
    all:      users.length,
    donor:    users.filter((u) => u.role === 'donor').length,
    hospital: users.filter((u) => u.role === 'hospital').length,
    admin:    users.filter((u) => u.role === 'admin').length,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-sm px-5 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      {/* Reset password confirmation modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Reset Password</h3>
            <p className="text-slate-500 text-sm mb-5">
              Generate a new temporary password for{' '}
              <strong>{resetTarget.name}</strong> ({resetTarget.email})? Their current password
              will stop working immediately.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setResetTarget(null)}
                className="flex-1 border-2 border-slate-200 hover:border-slate-300 text-slate-600 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resetLoading}
                className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-all"
              >
                {resetLoading ? 'Resetting…' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Temporary password display modal */}
      {tempPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1">🔑 Temporary Password</h3>
            <p className="text-slate-500 text-sm mb-4">
              Share this temporary password with <strong>{tempPassword.user.name}</strong> directly
              (phone/in person). It is shown only once — they should change it from their Profile
              page after logging in.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center text-xl font-bold tracking-widest text-rose-600 mb-5">
              {tempPassword.password}
            </div>
            <button
              onClick={() => setTempPassword(null)}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin" className="text-slate-400 hover:text-slate-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage all platform users</p>
        </div>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'donor', 'hospital', 'admin'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              roleFilter === r
                ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-rose-300'
            }`}
          >
            {r === 'all' ? 'All Users' : r.charAt(0).toUpperCase() + r.slice(1) + 's'}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${roleFilter === r ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {counts[r]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white shadow-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-slate-900 font-semibold">Users</h2>
          <span className="text-slate-400 text-xs bg-slate-100 px-2.5 py-1 rounded-full">{filtered.length} shown</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">👥</div>
            <p className="text-slate-900 font-semibold">No users found</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                  <th className="text-left px-6 py-3.5">Name</th>
                  <th className="text-left px-6 py-3.5">Email</th>
                  <th className="text-left px-6 py-3.5">Phone</th>
                  <th className="text-left px-6 py-3.5">Role</th>
                  <th className="text-left px-6 py-3.5">Status</th>
                  <th className="text-left px-6 py-3.5">Joined</th>
                  <th className="text-right px-6 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center text-rose-700 font-bold text-xs flex-shrink-0">
                          {u.name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <span className="font-medium text-slate-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{u.email}</td>
                    <td className="px-6 py-4 text-slate-500">{u.phone}</td>
                    <td className="px-6 py-4"><RoleBadge role={u.role} /></td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        u.is_active
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-green-500' : 'bg-slate-400'}`} />
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.role !== 'admin' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setResetTarget(u)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-colors"
                          >
                            🔑 Reset Password
                          </button>
                          <button
                            onClick={() => handleToggle(u)}
                            disabled={actionId === u.id}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                              u.is_active
                                ? 'text-slate-500 border-slate-200 hover:text-red-600 hover:border-red-300 hover:bg-red-50'
                                : 'text-green-700 border-green-200 hover:bg-green-50'
                            }`}
                          >
                            {actionId === u.id ? '…' : u.is_active ? '🔒 Deactivate' : '✅ Activate'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUserManagementPage;