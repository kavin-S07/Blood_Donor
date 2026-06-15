import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

type Step = 'email' | 'otp' | 'reset';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep]               = useState<Step>('email');
  const [email, setEmail]             = useState('');
  const [otp, setOtp]                 = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm]         = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [resending, setResending]     = useState(false);

  // Step 1 – request OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setStep('otp');
    } catch {
      setStep('otp'); // still proceed (prevents enumeration)
    } finally {
      setLoading(false);
    }
  };

  // Step 1.5 – resend OTP
  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      await authService.forgotPassword(email);
    } catch {}
    finally { setResending(false); }
  };

  // Step 2 – verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.verifyOtp(email, otp);
      setStep('reset');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 3 – reset password
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) { setError('Passwords do not match'); return; }
    setError('');
    setLoading(true);
    try {
      await authService.resetPassword(email, otp, newPassword);
      navigate('/login', { state: { message: 'Password reset successfully. Please log in.' } });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors';

  const stepLabel = step === 'email' ? 'Enter your email'
    : step === 'otp' ? 'Enter OTP'
    : 'Set new password';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-rose-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">🔑</div>
          <h1 className="text-2xl font-bold text-slate-900">Reset password</h1>
          <p className="text-slate-400 text-sm mt-1">{stepLabel}</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {(['email', 'otp', 'reset'] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                step === s ? 'bg-rose-600 text-white' :
                ['email','otp','reset'].indexOf(step) > i ? 'bg-green-500 text-white' :
                'bg-slate-200 text-slate-400'
              }`}>
                {['email','otp','reset'].indexOf(step) > i ? '✓' : i + 1}
              </div>
              {i < 2 && <div className={`h-0.5 w-8 rounded ${['email','otp','reset'].indexOf(step) > i ? 'bg-green-400' : 'bg-slate-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-rose-600 text-sm px-4 py-3 rounded-lg mb-5">
              {error}
            </div>
          )}

          {/* Step 1 – Email */}
          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-slate-500 text-sm mb-1.5">Email address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  required className={inputCls} placeholder="you@example.com" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
                {loading ? 'Sending OTP…' : 'Send OTP →'}
              </button>
            </form>
          )}

          {/* Step 2 – OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <p className="text-slate-400 text-sm">
                A 6-digit OTP was sent to <span className="text-slate-900 font-medium">{email}</span>.
              </p>
              <div>
                <label className="block text-slate-500 text-sm mb-1.5">OTP Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  className={`${inputCls} text-center text-xl tracking-widest font-bold`}
                  placeholder="• • • • • •"
                />
              </div>
              <button type="submit" disabled={loading || otp.length !== 6}
                className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
                {loading ? 'Verifying…' : 'Verify OTP →'}
              </button>
              <button type="button" onClick={handleResend} disabled={resending}
                className="w-full text-slate-400 hover:text-rose-600 text-sm transition-colors py-1">
                {resending ? 'Resending…' : 'Resend OTP'}
              </button>
            </form>
          )}

          {/* Step 3 – New password */}
          {step === 'reset' && (
            <form onSubmit={handleReset} className="space-y-5">
              <p className="text-slate-400 text-sm">
                OTP verified ✓ — Set a new password for <span className="text-slate-900">{email}</span>
              </p>
              <div>
                <label className="block text-slate-500 text-sm mb-1.5">New password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  required className={inputCls} placeholder="Min 8 chars" />
              </div>
              <div>
                <label className="block text-slate-500 text-sm mb-1.5">Confirm password</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  required className={inputCls} placeholder="Repeat password" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
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
