import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { BLOOD_GROUPS } from '../types/donor';

type Step = 'role' | 'details';

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
  <div>
    <label className="block text-slate-700 text-sm font-medium mb-1.5">{label}</label>
    <input
      {...props}
      className="w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all shadow-sm"
    />
  </div>
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: string[] }> = ({
  label, options, ...props
}) => (
  <div>
    <label className="block text-slate-700 text-sm font-medium mb-1.5">{label}</label>
    <select
      {...props}
      className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all shadow-sm"
    >
      <option value="">Select…</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const STEPS: Step[] = ['role', 'details'];
const STEP_LABELS: Record<Step, string> = {
  role:    'Account Type',
  details: 'Your Details',
};

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep]       = useState<Step>('role');
  const [role, setRole]       = useState<'donor' | 'hospital' | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', address: '', city: '', state: '',
    blood_group: '', age: '', gender: '',
    hospital_name: '', license_number: '', hospital_address: '', contact_number: '',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  // Create the account directly (no email/OTP verification step)
  const handleSignup = async () => {
    setError('');
    setLoading(true);
    try {
      const base = {
        name: form.name, email: form.email, password: form.password,
        phone: form.phone, address: form.address, city: form.city, state: form.state,
      };
      const payload =
        role === 'donor'
          ? { ...base, role: 'donor' as const, blood_group: form.blood_group, age: parseInt(form.age), gender: form.gender }
          : { ...base, role: 'hospital' as const, hospital_name: form.hospital_name, license_number: form.license_number, hospital_address: form.hospital_address, contact_number: form.contact_number };
      await authService.signup(payload);
      navigate('/login', { state: { message: 'Account created! Please log in.' } });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">✚</div>
            <span className="font-bold text-slate-900 text-xl">Blood<span className="text-rose-600">Connect</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="text-slate-500 text-sm mt-1">Join BloodConnect and start saving lives</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-200'
                    : stepIndex > i
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {stepIndex > i ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${step === s ? 'text-slate-700' : 'text-slate-400'}`}>
                  {STEP_LABELS[s]}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 rounded transition-all ${stepIndex > i ? 'bg-green-400' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* ── Step 1 – Role ── */}
          {step === 'role' && (
            <div className="space-y-4">
              <p className="text-slate-700 font-semibold mb-5">I'm registering as a…</p>
              {(['donor', 'hospital'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => { setRole(r); setError(''); }}
                  className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all ${
                    role === r
                      ? 'border-rose-500 bg-rose-50'
                      : 'border-slate-200 hover:border-rose-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{r === 'donor' ? '🩸 Blood Donor' : '🏥 Hospital'}</div>
                      <div className="text-slate-500 text-xs mt-1">
                        {r === 'donor' ? 'Register to donate blood and respond to requests' : 'Create blood requests and find compatible donors'}
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      role === r ? 'border-rose-500 bg-rose-500' : 'border-slate-300'
                    }`}>
                      {role === r && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </div>
                </button>
              ))}
              <button
                disabled={!role}
                onClick={() => setStep('details')}
                className="w-full mt-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-lg shadow-rose-200"
              >
                Continue →
              </button>
            </div>
          )}

          {/* ── Step 2 – Details ── */}
          {step === 'details' && (
            <div className="space-y-4">
              <Input label="Full name" value={form.name} onChange={set('name')} required placeholder="John Doe" />
              <Input label="Email address" type="email" value={form.email} onChange={set('email')} required placeholder="you@example.com" />
              <Input label="Password" type="password" value={form.password} onChange={set('password')} required placeholder="Minimum 8 characters" />
              <Input label="Phone number" value={form.phone} onChange={set('phone')} required placeholder="9876543210" />
              <div className="grid grid-cols-2 gap-4">
                <Input label="City" value={form.city} onChange={set('city')} placeholder="Chennai" />
                <Input label="State" value={form.state} onChange={set('state')} placeholder="Tamil Nadu" />
              </div>

              {role === 'donor' && (
                <>
                  <Select label="Blood group" value={form.blood_group} onChange={set('blood_group')} options={[...BLOOD_GROUPS]} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Age" type="number" value={form.age} onChange={set('age')} required placeholder="25" />
                    <Select label="Gender" value={form.gender} onChange={set('gender')} options={['male', 'female', 'other']} />
                  </div>
                </>
              )}

              {role === 'hospital' && (
                <>
                  <Input label="Hospital name" value={form.hospital_name} onChange={set('hospital_name')} required />
                  <Input label="License number" value={form.license_number} onChange={set('license_number')} required />
                  <Input label="Hospital address" value={form.hospital_address} onChange={set('hospital_address')} required />
                  <Input label="Contact number" value={form.contact_number} onChange={set('contact_number')} required />
                </>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep('role')}
                  className="flex-1 border-2 border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 py-3 rounded-xl text-sm font-medium transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSignup}
                  disabled={loading}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-lg shadow-rose-200"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating account…
                    </span>
                  ) : 'Create Account →'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-rose-600 hover:text-rose-700 font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
