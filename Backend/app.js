require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const cookieParser = require('cookie-parser');
const logger       = require('./middleware/logger.middleware');
const rateLimiter  = require('./middleware/rateLimit.middleware');
const { errorHandler, notFound } = require('./middleware/error.middleware');

const authRoutes         = require('./routes/auth.routes');
const hospitalRoutes     = require('./routes/hospital.routes');
const donorRoutes        = require('./routes/donor.routes');
const profileRoutes      = require('./routes/profile.routes');
const notificationRoutes = require('./routes/notification.routes');
const dashboardRoutes    = require('./routes/dashboard.routes');

const app = express();

// ── Trust Render's reverse proxy ─────────────────────────────
// Required so express-rate-limit can correctly read X-Forwarded-For
// (Render sits behind a load balancer/proxy). Without this,
// express-rate-limit throws ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
app.set('trust proxy', 1);

// ── Security ──────────────────────────────────────────────────
app.use(helmet());
// CORS: FRONTEND_URL can be comma-separated for multiple origins (Vercel + localhost)
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',').map(o => o.trim());
app.use(cors({
    origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error('CORS: origin not allowed'));
    },
    credentials: true,
    methods:     ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── General rate limit ────────────────────────────────────────
app.use(rateLimiter.general);

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Logger ────────────────────────────────────────────────────
app.use(logger);

// ── Health check ──────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({ success: true, message: 'BloodConnect API is running', timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/hospital',      hospitalRoutes);
app.use('/api/donor',         donorRoutes);
app.use('/api/profile',       profileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard',     dashboardRoutes);

// ── 404 & Error handlers ──────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
