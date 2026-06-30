import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  motion,
  useTransform,
  useSpring,
  useInView,
  useMotionValue,
  animate,
  AnimatePresence,
} from 'framer-motion';
import {
  Droplet,
  Bell,
  Hospital,
  ShieldCheck,
  Users,
  Activity,
  ArrowRight,
  Heart,
  Zap,
  Clock,
  CheckCircle2,
  Star,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ------------------------------------------------------------------ */
/* Animated number counter                                             */
/* ------------------------------------------------------------------ */
interface CounterProps {
  to: number;
  suffix?: string;
  duration?: number;
  decimals?: number;
}

const Counter: React.FC<CounterProps> = ({ to, suffix = '', duration = 2, decimals = 0 }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [inView, to, duration]);

  return (
    <span ref={ref}>
      {val.toFixed(decimals)}
      {suffix}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* Floating blood drops in hero (lightweight, count-limited)           */
/* ------------------------------------------------------------------ */
const FloatingDrops: React.FC<{ count?: number }> = ({ count = 6 }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapRef, { margin: '-10% 0px -10% 0px' });

  const drops = Array.from({ length: count }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: 8 + Math.random() * 18,
    delay: Math.random() * 6,
    duration: 10 + Math.random() * 8,
    opacity: 0.15 + Math.random() * 0.3,
  }));

  return (
    <div ref={wrapRef} className="absolute inset-0 pointer-events-none overflow-hidden">
      {inView &&
        drops.map((d) => (
          <motion.div
            key={d.id}
            className="absolute will-change-transform"
            style={{ left: `${d.left}%`, top: '-10%', opacity: d.opacity }}
            animate={{ y: ['0vh', '120vh'] }}
            transition={{
              duration: d.duration,
              delay: d.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <svg width={d.size} height={d.size * 1.3} viewBox="0 0 24 32" fill="none">
              <path
                d="M12 2 C12 2 2 14 2 21 a10 10 0 0 0 20 0 C22 14 12 2 12 2 Z"
                fill={`url(#dropGrad-${d.id})`}
              />
              <defs>
                <linearGradient id={`dropGrad-${d.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fb7185" />
                  <stop offset="100%" stopColor="#be123c" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
        ))}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* ECG / heartbeat line                                                */
/* ------------------------------------------------------------------ */
const HEARTBEAT_PATH =
  'M0 40 L120 40 L150 40 L170 10 L200 70 L220 40 L260 40 L290 25 L320 55 L350 40 L800 40';

const Heartbeat: React.FC = () => (
  <svg className="w-full h-16" viewBox="0 0 800 80" preserveAspectRatio="none">
    <motion.path
      d={HEARTBEAT_PATH}
      stroke="#f43f5e"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 2.4, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.6 }}
    />
  </svg>
);

/* ------------------------------------------------------------------ */
/* Magnetic CTA button                                                 */
/* ------------------------------------------------------------------ */
interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  to: string;
  [key: string]: any;
}

const MagneticButton: React.FC<MagneticButtonProps> = ({ children, className = '', to, ...rest }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 15 });
  const sy = useSpring(y, { stiffness: 200, damping: 15 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const mx = e.clientX - r.left - r.width / 2;
    const my = e.clientY - r.top - r.height / 2;
    x.set(mx * 0.25);
    y.set(my * 0.35);
  };
  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div ref={ref} onMouseMove={handleMove} onMouseLeave={handleLeave} style={{ x: sx, y: sy }}>
      <Link to={to} className={className} {...rest}>
        {children}
      </Link>
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/* Reveal-on-scroll wrapper                                            */
/* ------------------------------------------------------------------ */
interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}

const Reveal: React.FC<RevealProps> = ({ children, delay = 0, y = 30, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/* Marquee wrapper — only animates while in viewport                   */
/* ------------------------------------------------------------------ */
interface MarqueeProps {
  children: React.ReactNode;
  duration: number;
  className?: string;
}

const Marquee: React.FC<MarqueeProps> = ({ children, duration, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: '-10% 0px -10% 0px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      animate={inView ? { x: ['0%', '-50%'] } : {}}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
    >
      {children}
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/* Feature / step data (defined outside component)                     */
/* ------------------------------------------------------------------ */
const FEATURES = [
  {
    Icon: Droplet,
    title: 'Smart Matching',
    desc: 'Donors are matched by blood compatibility automatically — no manual lookup, no delay.',
    accent: true,
  },
  {
    Icon: Bell,
    title: 'Instant Alerts',
    desc: 'Hospitals create a request; compatible donors receive a push notification within seconds.',
    accent: false,
  },
  {
    Icon: Hospital,
    title: 'Dual Portals',
    desc: 'Separate, role-locked dashboards for donors and hospitals — clean and purpose-built.',
    accent: false,
  },
  {
    Icon: ShieldCheck,
    title: 'Secure Auth',
    desc: 'JWT access tokens (15 min) + refresh tokens (7 days) with automatic silent renewal.',
    accent: false,
  },
  {
    Icon: Users,
    title: 'Role-Based Access',
    desc: 'Separate donor and hospital dashboards with permissions tailored to each role.',
    accent: false,
  },
  {
    Icon: Activity,
    title: 'Donation History',
    desc: 'Full audit trail for both donors and hospitals — transparency at every stage.',
    accent: false,
  },
];

const STATS = [
  { value: 8, suffix: '', label: 'Blood Types Matched', Icon: Droplet },
  { value: 30, suffix: 's', prefix: '<', label: 'Notification Speed', Icon: Zap },
  { value: 100, suffix: '%', label: 'Compatibility Checked', Icon: CheckCircle2 },
  { value: 24, suffix: '/7', label: 'Always Available', Icon: Clock },
];

const STEPS = [
  {
    step: '01',
    title: 'Hospital creates request',
    desc: 'Specify blood type, units needed, and urgency level.',
    Icon: Hospital,
  },
  {
    step: '02',
    title: 'Donors are notified',
    desc: 'Compatible donors receive instant push notifications.',
    Icon: Bell,
  },
  {
    step: '03',
    title: 'Blood is donated',
    desc: 'Donor accepts, meets at hospital, and saves a life.',
    Icon: Heart,
  },
];

const TICKER_ROWS = [
  { type: 'O-', city: 'Mumbai', urgent: true },
  { type: 'A+', city: 'Delhi', urgent: false },
  { type: 'AB-', city: 'Bangalore', urgent: true },
  { type: 'B+', city: 'Chennai', urgent: false },
  { type: 'O+', city: 'Pune', urgent: false },
  { type: 'A-', city: 'Hyderabad', urgent: true },
  { type: 'AB+', city: 'Kolkata', urgent: false },
  { type: 'B-', city: 'Jaipur', urgent: false },
];

const TESTIMONIALS = [
  {
    name: 'Dr. Anika Mehra',
    role: 'Apollo Hospital',
    quote: 'BloodConnect cut our emergency response time by 60%. Compatible donors arrived in under 20 minutes.',
  },
  {
    name: 'Rohan Verma',
    role: 'O- Donor · 12 donations',
    quote: 'Getting a notification at 2 AM and saving a life by morning — this app gave that purpose to me.',
  },
  {
    name: 'Fortis Healthcare',
    role: 'Partner Hospital',
    quote: 'The dual portal design lets our staff focus on patients. Matching just happens.',
  },
  {
    name: 'Priya Singh',
    role: 'AB+ Donor · 8 donations',
    quote: "Clean UI, instant alerts, and a community that actually shows up. I'm hooked.",
  },
];

/* ------------------------------------------------------------------ */
/* Main page                                                            */
/* ------------------------------------------------------------------ */
const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  const heroRef = useRef<HTMLElement>(null);

  const mx = useMotionValue(50);
  const my = useMotionValue(40);
  const smx = useSpring(mx, { stiffness: 80, damping: 20 });
  const smy = useSpring(my, { stiffness: 80, damping: 20 });
  const handleHeroMouse = (e: React.MouseEvent<HTMLElement>) => {
    if (!heroRef.current) return;
    const r = heroRef.current.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 100);
    my.set(((e.clientY - r.top) / r.height) * 100);
  };

  const spotlight = useTransform([smx, smy], ([x, y]) =>
    `radial-gradient(600px circle at ${x}% ${y}%, rgba(244,63,94,0.18), transparent 60%)`
  );

  const dashboardPath =
    user?.role === 'donor' ? '/donor' : user?.role === 'hospital' ? '/hospital' : '/admin';

  return (
    <div className="min-h-screen bg-white overflow-x-hidden text-slate-900">
      {/* HERO */}
      <section
        ref={heroRef}
        onMouseMove={handleHeroMouse}
        className="relative overflow-hidden"
        data-testid="hero-section"
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute -top-32 -right-24 w-[28rem] h-[28rem] bg-rose-200 rounded-full opacity-60 blur-2xl will-change-transform"
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-1/2 -left-24 w-72 h-72 bg-rose-100 rounded-full opacity-70 blur-xl will-change-transform"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle, #fecdd3 1px, transparent 1px)',
              backgroundSize: '32px 32px',
              opacity: 0.45,
            }}
          />
          <motion.div className="absolute inset-0 hidden md:block" style={{ background: spotlight }} />
        </div>

        <FloatingDrops count={6} />

        <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-white/80 backdrop-blur border border-rose-200 rounded-full px-4 py-1.5 mb-8 shadow-sm shadow-rose-100"
              data-testid="hero-badge"
            >
              <motion.span
                className="w-2 h-2 bg-rose-500 rounded-full"
                animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
              <span className="text-rose-700 text-xs font-semibold tracking-wide uppercase">
                Life-saving platform · Live now
              </span>
            </motion.div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-[1.05] tracking-tight">
              {['Every', 'drop', 'of'].map((w, i) => (
                <motion.span
                  key={w}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 + i * 0.08 }}
                  className="inline-block mr-3"
                >
                  {w}
                </motion.span>
              ))}
              <motion.span
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-rose-600 relative inline-block"
              >
                blood
                <motion.svg
                  className="absolute -bottom-3 left-0 w-full"
                  viewBox="0 0 300 12"
                  fill="none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  <motion.path
                    d="M2 8 C50 2, 150 2, 298 8"
                    stroke="#fda4af"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, delay: 1 }}
                  />
                </motion.svg>
              </motion.span>
              <br />
              {['saves', 'a', 'life.'].map((w, i) => (
                <motion.span
                  key={w}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 + i * 0.08 }}
                  className="inline-block mr-3"
                >
                  {w}
                </motion.span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1 }}
              className="text-slate-500 text-lg md:text-xl max-w-xl mb-10 leading-relaxed"
            >
              BloodConnect links donors and hospitals in real time — matching compatible blood
              types instantly and mobilizing volunteers the moment they're needed.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.15 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              {isAuthenticated ? (
                <MagneticButton
                  to={dashboardPath}
                  className="group inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-rose-200 hover:shadow-rose-300 text-sm"
                  data-testid="hero-dashboard-btn"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </MagneticButton>
              ) : (
                <>
                  <MagneticButton
                    to="/signup"
                    className="group relative inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors shadow-lg shadow-rose-200 hover:shadow-rose-300 text-sm overflow-hidden"
                    data-testid="hero-cta-donor"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Become a Donor
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </span>
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-rose-700 via-red-600 to-rose-700"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '0%' }}
                      transition={{ duration: 0.4 }}
                    />
                  </MagneticButton>
                  <MagneticButton
                    to="/signup"
                    className="group inline-flex items-center justify-center gap-2 border-2 border-slate-200 hover:border-rose-400 text-slate-700 hover:text-rose-700 bg-white/60 backdrop-blur font-semibold px-8 py-3.5 rounded-xl transition-all text-sm"
                    data-testid="hero-cta-hospital"
                  >
                    <Hospital className="w-4 h-4" />
                    Register Hospital
                  </MagneticButton>
                </>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 1.4 }}
              className="flex items-center gap-4 mt-10"
            >
              <div className="flex -space-x-2">
                {['A+', 'B+', 'O-', 'AB+'].map((g, i) => (
                  <motion.div
                    key={g}
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 1.5 + i * 0.1, type: 'spring', stiffness: 200 }}
                    whileHover={{ y: -4, scale: 1.1 }}
                    className="w-9 h-9 bg-gradient-to-br from-rose-500 to-red-600 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shadow-md"
                  >
                    {g}
                  </motion.div>
                ))}
              </div>
              <p className="text-slate-500 text-sm">
                All 8 blood types covered —{' '}
                <span className="text-slate-700 font-semibold">real-time matching</span>
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.7 }}
              className="mt-12 max-w-md"
            >
              <Heartbeat />
            </motion.div>
          </div>
        </div>
      </section>

      {/* STATS bar with counters */}
      <section
        className="relative bg-gradient-to-r from-rose-700 via-rose-600 to-red-600 overflow-hidden"
        data-testid="stats-section"
      >
        <div className="relative max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map((s, i) => {
            const Icon = s.Icon;
            return (
              <Reveal key={s.label} delay={i * 0.08}>
                <motion.div whileHover={{ y: -4 }} className="text-white" data-testid={`stat-${i}`}>
                  <Icon className="w-6 h-6 mx-auto mb-2 text-rose-200" />
                  <div className="text-3xl md:text-4xl font-bold tracking-tight">
                    {s.prefix || ''}
                    <Counter to={s.value} suffix={s.suffix} />
                  </div>
                  <div className="text-rose-100 text-sm mt-1">{s.label}</div>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* LIVE TICKER */}
      <section className="bg-slate-900 py-3 overflow-hidden border-y border-slate-800" data-testid="live-ticker">
        <Marquee duration={35} className="flex gap-12 whitespace-nowrap text-sm text-slate-300">
          {Array.from({ length: 2 }).map((_, dup) => (
            <div key={dup} className="flex gap-12 shrink-0">
              {TICKER_ROWS.map((r, i) => (
                <div key={i} className="flex items-center gap-2 shrink-0">
                  {r.urgent && (
                    <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                      <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse" />
                      URGENT
                    </span>
                  )}
                  <span className="font-mono font-bold text-white">{r.type}</span>
                  <span className="text-slate-500">needed in</span>
                  <span className="text-rose-300">{r.city}</span>
                  <span className="text-slate-700">•</span>
                </div>
              ))}
            </div>
          ))}
        </Marquee>
      </section>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-6 py-24" data-testid="features-section">
        <Reveal className="text-center mb-16">
          <span className="inline-flex items-center gap-2 text-rose-600 font-semibold text-sm uppercase tracking-widest">
            <Sparkles className="w-4 h-4" />
            Why BloodConnect
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mt-3 tracking-tight">
            Built for speed.{' '}
            <span className="bg-gradient-to-r from-rose-600 to-red-500 bg-clip-text text-transparent">
              Built for lives.
            </span>
          </h2>
          <p className="text-slate-500 mt-4 max-w-xl mx-auto">
            Every feature is engineered around one goal: getting blood to where it's needed, faster.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => {
            const Icon = f.Icon;
            return (
              <Reveal key={f.title} delay={i * 0.05}>
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className={`group relative rounded-2xl p-6 border h-full overflow-hidden transition-shadow hover:shadow-xl ${
                    f.accent
                      ? 'bg-gradient-to-br from-rose-600 to-red-600 border-rose-600 text-white shadow-lg shadow-rose-200'
                      : 'bg-white border-slate-100 shadow-sm hover:border-rose-200'
                  }`}
                  data-testid={`feature-card-${i}`}
                >
                  {!f.accent && (
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                  <div className="relative">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                        f.accent ? 'bg-white/20' : 'bg-rose-50 group-hover:bg-rose-100'
                      } transition-colors`}
                    >
                      <Icon className={`w-6 h-6 ${f.accent ? 'text-white' : 'text-rose-600'}`} />
                    </div>
                    <h3 className={`font-semibold text-lg mb-2 ${f.accent ? 'text-white' : 'text-slate-900'}`}>
                      {f.title}
                    </h3>
                    <p className={`text-sm leading-relaxed ${f.accent ? 'text-rose-100' : 'text-slate-500'}`}>
                      {f.desc}
                    </p>
                  </div>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-24" data-testid="how-it-works">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal className="text-center mb-16">
            <span className="text-rose-600 font-semibold text-sm uppercase tracking-widest">How It Works</span>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mt-3 tracking-tight">
              From request to donation in <span className="text-rose-600">minutes</span>
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <motion.div
              className="hidden md:block absolute top-8 left-[16%] right-[16%] h-0.5 bg-rose-200 origin-left"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
            />
            {STEPS.map((s, i) => {
              const Icon = s.Icon;
              return (
                <Reveal key={s.step} delay={i * 0.2} className="text-center relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-rose-600 to-red-600 text-white rounded-2xl flex items-center justify-center text-lg font-bold mx-auto mb-5 shadow-lg shadow-rose-300 relative">
                    {s.step}
                  </div>
                  <div className="inline-flex items-center justify-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-rose-500" />
                    <h3 className="font-semibold text-slate-900 text-lg">{s.title}</h3>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">{s.desc}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 bg-white overflow-hidden" data-testid="testimonials">
        <Reveal className="text-center mb-14 px-6">
          <span className="text-rose-600 font-semibold text-sm uppercase tracking-widest">Voices</span>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mt-3 tracking-tight">
            Stories that move us
          </h2>
        </Reveal>

        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10" />
          <Marquee duration={40} className="flex gap-6">
            {Array.from({ length: 2 }).map((_, dup) => (
              <div key={dup} className="flex gap-6 shrink-0">
                {TESTIMONIALS.map((t, i) => (
                  <div
                    key={i}
                    className="w-[340px] md:w-[400px] shrink-0 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow"
                  >
                    <div className="flex gap-1 mb-3">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star key={s} className="w-4 h-4 fill-rose-400 text-rose-400" />
                      ))}
                    </div>
                    <p className="text-slate-700 leading-relaxed mb-4">"{t.quote}"</p>
                    <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white font-semibold">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">{t.name}</div>
                        <div className="text-slate-500 text-xs">{t.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </Marquee>
        </div>
      </section>

      {/* CTA */}
      <AnimatePresence>
        {!isAuthenticated && (
          <section
            className="relative bg-gradient-to-br from-rose-700 via-rose-600 to-red-700 py-24 overflow-hidden"
            data-testid="cta-section"
          >
            <div className="relative max-w-3xl mx-auto px-6 text-center">
              <Reveal>
                <Heart className="w-12 h-12 text-white mx-auto mb-6 fill-white/30" />
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                  Ready to make a difference?
                </h2>
                <p className="text-rose-100 text-lg mb-10 max-w-xl mx-auto">
                  Join donors and hospitals already using BloodConnect to save lives every day.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <MagneticButton
                    to="/signup"
                    className="inline-flex items-center justify-center gap-2 bg-white text-rose-700 font-semibold px-10 py-3.5 rounded-xl transition-all hover:bg-rose-50 shadow-xl text-sm"
                    data-testid="cta-join-donor"
                  >
                    <Droplet className="w-4 h-4" />
                    Join as Donor
                  </MagneticButton>
                  <MagneticButton
                    to="/signup"
                    className="inline-flex items-center justify-center gap-2 bg-rose-800/40 backdrop-blur text-white font-semibold px-10 py-3.5 rounded-xl transition-all hover:bg-rose-800/60 border border-rose-300/40 text-sm"
                    data-testid="cta-register-hospital"
                  >
                    <Hospital className="w-4 h-4" />
                    Register Hospital
                  </MagneticButton>
                </div>
              </Reveal>
            </div>
          </section>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-100 py-8" data-testid="footer">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-rose-600 to-red-600 rounded-md flex items-center justify-center text-white text-xs font-bold shadow-sm">
              <Droplet className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900">
              Blood<span className="text-rose-600">Connect</span>
            </span>
          </div>
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} BloodConnect — Every drop counts.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;