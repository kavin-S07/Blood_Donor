import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/Profileservice';

const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', address: '', city: '', state: '' });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await profileService.getProfile();
        setProfileData(data);
        setEditForm({
          name: data.name as string || '',
          phone: data.phone as string || '',
          address: data.address as string || '',
          city: data.city as string || '',
          state: data.state as string || '',
        });
      } catch {} finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await profileService.updateProfile(editForm);
      await refreshUser();
      setSuccess('Profile updated successfully');
      setEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) { setPwError('Passwords do not match'); return; }
    setPwError('');
    setPwLoading(true);
    try {
      await profileService.changePassword(pwForm.current_password, pwForm.new_password);
      setPwSuccess('Password changed successfully');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
      setTimeout(() => setPwSuccess(''), 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setPwError(msg || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const inputCls = 'w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all shadow-sm';

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const roleProfile = profileData.profile as Record<string, unknown> | null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account information and settings</p>
      </div>

      {/* User Info */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-slate-900 font-semibold">Account Details</h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-rose-600 hover:text-rose-700 font-medium border border-rose-200 hover:border-rose-400 px-3 py-1.5 rounded-lg transition-colors"
            >
              Edit profile
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
            <span>!</span> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-4">
            <span>✓</span> {success}
          </div>
        )}

        {/* Avatar row */}
        <div className="flex items-center gap-4 mb-6 pb-5 border-b border-slate-100">
          <div className="w-14 h-14 bg-rose-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-sm">
            {user?.role === 'donor' ? '🩸' : '🏥'}
          </div>
          <div>
            <div className="text-slate-900 font-semibold text-lg">{profileData.name as string}</div>
            <div className="text-slate-500 text-sm">{profileData.email as string}</div>
            <span className="text-xs bg-rose-100 text-rose-700 font-semibold px-2.5 py-0.5 rounded-full capitalize mt-1 inline-block">
              {user?.role}
            </span>
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-700 text-sm font-medium mb-1.5 block">Name</label>
                <input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="text-slate-700 text-sm font-medium mb-1.5 block">Phone</label>
                <input value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="text-slate-700 text-sm font-medium mb-1.5 block">Address</label>
              <input value={editForm.address} onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))} className={inputCls} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-700 text-sm font-medium mb-1.5 block">City</label>
                <input value={editForm.city} onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="text-slate-700 text-sm font-medium mb-1.5 block">State</label>
                <input value={editForm.state} onChange={(e) => setEditForm((f) => ({ ...f, state: e.target.value }))} className={inputCls} />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setEditing(false)} className="flex-1 border-2 border-slate-200 text-slate-600 hover:text-slate-800 py-2.5 rounded-xl text-sm transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-sm">
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: 'Phone', value: profileData.phone },
              { label: 'City', value: profileData.city },
              { label: 'State', value: profileData.state },
              { label: 'Address', value: profileData.address },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3">
                <div className="text-slate-400 text-xs font-medium uppercase tracking-wide">{label}</div>
                <div className="text-slate-800 text-sm font-medium mt-1">{(value as string) || '—'}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role-specific profile */}
      {roleProfile && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-slate-900 font-semibold mb-5">
            {user?.role === 'donor' ? '🩸 Donor Profile' : '🏥 Hospital Profile'}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {user?.role === 'donor' ? (
              <>
                {[
                  { label: 'Blood Group', value: roleProfile.blood_group },
                  { label: 'Age', value: roleProfile.age },
                  { label: 'Gender', value: roleProfile.gender },
                  { label: 'Total Donations', value: roleProfile.total_donations },
                  { label: 'Last Donation', value: roleProfile.last_donation_date ? new Date(roleProfile.last_donation_date as string).toLocaleDateString() : 'Never' },
                  { label: 'Availability', value: roleProfile.availability ? 'Available' : 'Unavailable' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3">
                    <div className="text-slate-400 text-xs font-medium uppercase tracking-wide">{label}</div>
                    <div className={`text-sm font-medium mt-1 ${label === 'Blood Group' ? 'text-rose-600 font-bold text-base' : 'text-slate-800'}`}>
                      {String(value ?? '—')}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                {[
                  { label: 'Hospital Name', value: roleProfile.hospital_name },
                  { label: 'License Number', value: roleProfile.license_number },
                  { label: 'Hospital Address', value: roleProfile.hospital_address },
                  { label: 'Contact Number', value: roleProfile.contact_number },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3">
                    <div className="text-slate-400 text-xs font-medium uppercase tracking-wide">{label}</div>
                    <div className="text-slate-800 text-sm font-medium mt-1">{(value as string) || '—'}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Change Password */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <h2 className="text-slate-900 font-semibold mb-5">🔐 Change Password</h2>

        {pwError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
            <span>!</span> {pwError}
          </div>
        )}
        {pwSuccess && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-4">
            <span>✓</span> {pwSuccess}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="text-slate-700 text-sm font-medium mb-1.5 block">Current password</label>
            <input type="password" value={pwForm.current_password} onChange={(e) => setPwForm((f) => ({ ...f, current_password: e.target.value }))} required className={inputCls} />
          </div>
          <div>
            <label className="text-slate-700 text-sm font-medium mb-1.5 block">New password</label>
            <input type="password" value={pwForm.new_password} onChange={(e) => setPwForm((f) => ({ ...f, new_password: e.target.value }))} required className={inputCls} />
          </div>
          <div>
            <label className="text-slate-700 text-sm font-medium mb-1.5 block">Confirm new password</label>
            <input type="password" value={pwForm.confirm} onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))} required className={inputCls} />
          </div>
          <button
            type="submit"
            disabled={pwLoading}
            className="bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all shadow-sm"
          >
            {pwLoading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
