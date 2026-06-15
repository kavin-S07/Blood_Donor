import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-rose-100 rounded-full opacity-60" />
          <div className="absolute top-1/2 -left-16 w-64 h-64 bg-rose-50 rounded-full opacity-80" />
          <div className="absolute bottom-0 right-1/3 w-48 h-48 bg-red-50 rounded-full opacity-60" />
          {/* Grid pattern */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, #fecdd3 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            opacity: 0.4
          }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-full px-4 py-1.5 mb-8">
              <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
              <span className="text-rose-700 text-xs font-semibold tracking-wide uppercase">Life-saving platform</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-[1.1] tracking-tight">
              Every drop of{' '}
              <span className="text-rose-600 relative">
                blood
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <path d="M2 8 C50 2, 150 2, 298 8" stroke="#fda4af" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </span>
              {' '}saves a life
            </h1>

            <p className="text-slate-500 text-lg md:text-xl max-w-xl mb-10 leading-relaxed">
              BloodConnect connects donors and hospitals in real time — matching compatible blood types instantly and mobilizing volunteers the moment they're needed.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              {isAuthenticated ? (
                <Link
                  to={user?.role === 'donor' ? '/donor' : '/hospital'}
                  className="inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-rose-200 hover:shadow-rose-300 text-sm"
                >
                  Go to Dashboard
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-rose-200 hover:shadow-rose-300 text-sm"
                  >
                    Become a Donor
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center gap-2 border-2 border-slate-200 hover:border-rose-300 text-slate-700 hover:text-rose-700 font-semibold px-8 py-3.5 rounded-xl transition-all text-sm"
                  >
                    Register Hospital
                  </Link>
                </>
              )}
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4 mt-10">
              <div className="flex -space-x-2">
                {['A+', 'B+', 'O-', 'AB+'].map((g) => (
                  <div key={g} className="w-8 h-8 bg-rose-600 rounded-full border-2 border-white flex items-center justify-center text-white text-[9px] font-bold">
                    {g}
                  </div>
                ))}
              </div>
              <p className="text-slate-500 text-sm">All 8 blood types covered — <span className="text-slate-700 font-semibold">real-time matching</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-rose-600">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '8', label: 'Blood Types Matched', icon: '🩸' },
            { value: '<30s', label: 'Notification Speed', icon: '⚡' },
            { value: '100%', label: 'Compatibility Checked', icon: '✓' },
            { value: '24/7', label: 'Always Available', icon: '🏥' },
          ].map((s) => (
            <div key={s.label} className="text-white">
              <div className="text-3xl font-bold">{s.value}</div>
              <div className="text-rose-200 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <span className="text-rose-600 font-semibold text-sm uppercase tracking-widest">Why BloodConnect</span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-3">Built for speed. Built for lives.</h2>
          <p className="text-slate-500 mt-4 max-w-xl mx-auto">Every feature is designed around one goal: getting blood to where it's needed, faster.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: '🩸',
              title: 'Smart Matching',
              desc: 'Donors are matched by blood compatibility automatically — no manual lookup, no delay.',
              accent: true,
            },
            {
              icon: '🔔',
              title: 'Instant Alerts',
              desc: 'Hospitals create a request; compatible donors receive a push notification within seconds.',
              accent: false,
            },
            {
              icon: '🏥',
              title: 'Dual Portals',
              desc: 'Separate, role-locked dashboards for donors and hospitals — clean and purpose-built.',
              accent: false,
            },
            {
              icon: '🔐',
              title: 'Secure Auth',
              desc: 'JWT access tokens (15 min) + refresh tokens (7 days) with automatic silent renewal.',
              accent: false,
            },
            {
              icon: '📋',
              title: 'Role-Based Access',
              desc: 'Separate donor and hospital dashboards with permissions tailored to each role.',
              accent: false,
            },
            {
              icon: '📊',
              title: 'Donation History',
              desc: 'Full audit trail for both donors and hospitals — transparency at every stage.',
              accent: false,
            },
          ].map((f) => (
            <div
              key={f.title}
              className={`rounded-2xl p-6 border transition-all hover:-translate-y-1 hover:shadow-lg ${
                f.accent
                  ? 'bg-rose-600 border-rose-600 text-white'
                  : 'bg-white border-slate-100 shadow-sm hover:border-rose-200'
              }`}
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className={`font-semibold text-lg mb-2 ${f.accent ? 'text-white' : 'text-slate-900'}`}>{f.title}</h3>
              <p className={`text-sm leading-relaxed ${f.accent ? 'text-rose-100' : 'text-slate-500'}`}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-rose-600 font-semibold text-sm uppercase tracking-widest">How It Works</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-3">From request to donation in minutes</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-1/3 right-1/3 h-0.5 bg-rose-200" />
            {[
              { step: '01', title: 'Hospital creates request', desc: 'Specify blood type, units needed, and urgency level.' },
              { step: '02', title: 'Donors are notified', desc: 'Compatible donors receive instant notifications.' },
              { step: '03', title: 'Blood is donated', desc: 'Donor accepts, meets at hospital, and saves a life.' },
            ].map((s) => (
              <div key={s.step} className="text-center relative z-10">
                <div className="w-16 h-16 bg-rose-600 text-white rounded-2xl flex items-center justify-center text-lg font-bold mx-auto mb-5 shadow-lg shadow-rose-200">
                  {s.step}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2 text-lg">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!isAuthenticated && (
        <section className="bg-rose-600 py-24">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to make a difference?</h2>
            <p className="text-rose-100 text-lg mb-10">Join donors and hospitals already using BloodConnect to save lives every day.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center bg-white text-rose-700 font-semibold px-10 py-3.5 rounded-xl transition-all hover:bg-rose-50 shadow-lg text-sm"
              >
                Join as Donor
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center bg-rose-700 text-white font-semibold px-10 py-3.5 rounded-xl transition-all hover:bg-rose-800 border border-rose-500 text-sm"
              >
                Register Hospital
              </Link>
            </div>
          </div>
        </section>
      )}

      <footer className="bg-white border-t border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-rose-600 rounded-md flex items-center justify-center text-white text-xs font-bold">✚</div>
            <span className="font-bold text-slate-900">Blood<span className="text-rose-600">Connect</span></span>
          </div>
          <p className="text-slate-400 text-sm">© {new Date().getFullYear()} BloodConnect — Every drop counts.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
