import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

type Step = 'email' | 'reset';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setStep('reset');
    } catch {
      // Even on error, proceed — prevents email enumeration
      setStep('reset');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) { setError('Passwords do not match'); return; }
    setError('');
    setLoading(true);
    try {
      await authService.resetPassword(email, newPassword);
      navigate('/login', { state: { message: 'Password reset successfully. Please log in.' } });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-rose-600 rounded-full flex items-center justify-center text-slate-900 text-xl font-bold mx-auto mb-4">🔑</div>
          <h1 className="text-2xl font-bold text-slate-900">Reset password</h1>
          <p className="text-slate-400 text-sm mt-1">Enter your email to reset your password</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-rose-500 text-sm px-4 py-3 rounded-lg mb-5">
              {error}
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleCheckEmail} className="space-y-5">
              <div>
                <label className="block text-slate-500 text-sm mb-1.5">Email address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} placeholder="you@example.com" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-slate-900 font-semibold py-2.5 rounded-lg text-sm transition-colors">
                {loading ? 'Checking…' : 'Continue →'}
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleReset} className="space-y-5">
              <p className="text-slate-400 text-sm">Set a new password for <span className="text-slate-900">{email}</span></p>
              <div>
                <label className="block text-slate-500 text-sm mb-1.5">New password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className={inputCls} placeholder="Min 8 chars" />
              </div>
              <div>
                <label className="block text-slate-500 text-sm mb-1.5">Confirm password</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className={inputCls} placeholder="Repeat password" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-slate-900 font-semibold py-2.5 rounded-lg text-sm transition-colors">
                {loading ? 'Resetting…' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-slate-400 text-sm mt-6">
          Remember it?{' '}
          <Link to="/login" className="text-rose-600 hover:text-rose-500">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
