// server.js
require('dotenv').config();

const http = require('http');
const app  = require('./app');
const db   = require('./config/db');
const { runMigrations }    = require('./database/migrate');
const createDefaultAdmin   = require('./services/adminSeeder');

const { Server } = require('socket.io');
const jwt         = require('jsonwebtoken');
const jwtConfig   = require('./config/jwt');
const trackingSvc = require('./services/locationTracking.service');
const osrmSvc     = require('./services/osrm.service');
const liveTrackingSvc = require('./services/liveTracking.service');
const notifSvc        = require('./services/notification.service');
const hospitalSvc     = require('./services/hospital.service');

const PORT   = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map(o => o.trim()),
        credentials: true,
    },
});

// Authenticate Socket.IO connections via token
io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
        const decoded = jwt.verify(token, jwtConfig.accessTokenSecret);
        socket.userId = decoded.userId;
        socket.userRole = decoded.role;
        next();
    } catch {
        next(new Error('Invalid token'));
    }
});

io.on('connection', (socket) => {
    console.log(`Socket connected: user ${socket.userId} (${socket.userRole})`);

    // Donor joins a tracking room for a specific request
    socket.on('track:start', (data) => {
        const { requestId } = data;
        if (socket.userRole !== 'donor') return;
        socket.join(`request:${requestId}`);
        socket.currentRequestId = requestId;
        console.log(`Donor ${socket.userId} started tracking for request ${requestId}`);
    });

    // Donor updates live location every 5s
    socket.on('track:location', async (data) => {
        if (socket.userRole !== 'donor' || !socket.currentRequestId) return;
        const { latitude, longitude } = data;
        if (!latitude || !longitude) return;

        try {
            await trackingSvc.updateDonorLocation(socket.userId, socket.currentRequestId, latitude, longitude);

            // Broadcast to the hospital room for this request
            io.to(`request:${socket.currentRequestId}`).emit('donor:location', {
                donorId: socket.userId,
                latitude,
                longitude,
                updatedAt: new Date().toISOString(),
            });
        } catch (err) {
            console.error('Location tracking error:', err.message);
        }
    });

    // ── Real-Time Donor Live Tracking ──────────────────────────

    // Donor sends live location every 5s with full payload
    socket.on('location:update', async (data) => {
        if (socket.userRole !== 'donor' || !socket.currentRequestId) return;
        const { latitude, longitude, heading, speed, accuracy } = data;
        if (latitude == null || longitude == null) return;

        try {
            const result = await liveTrackingSvc.processLocationUpdate(
                socket.userId,
                socket.currentRequestId,
                latitude,
                longitude,
                speed ?? null,
                heading ?? null,
                accuracy ?? null
            );

            const payload = {
                userId: socket.userId,
                latitude,
                longitude,
                heading: heading ?? null,
                speed: speed ?? null,
                accuracy: accuracy ?? null,
                timestamp: new Date().toISOString(),
            };

            io.to(`request:${socket.currentRequestId}`).emit('location:receive', payload);

            if (result.arrived) {
                io.to(`request:${socket.currentRequestId}`).emit('donor:arrived', {
                    userId: socket.userId,
                    requestId: socket.currentRequestId,
                    message: 'Donor has arrived at the hospital',
                });
                socket.leave(`request:${socket.currentRequestId}`);

                // Log tracking event + notify both parties
                const reqData = result.request;
                if (reqData) {
                    try {
                        const donorUserId = socket.userId;
                        const { rows: hospRows } = await (require('./config/db')).query(
                            'SELECT user_id FROM hospitals WHERE id = $1', [reqData.hospital_id]
                        );
                        const hospUserId = hospRows[0]?.user_id;
                        if (hospUserId) {
                            const { rows: donorRows } = await (require('./config/db')).query(
                                `SELECT u.name FROM donors d JOIN users u ON d.user_id = u.id WHERE u.id = $1`,
                                [donorUserId]
                            );
                            const donorName = donorRows[0]?.name || 'Donor';
                            const hospName = reqData.hospital_name || 'Hospital';
                            await notifSvc.notifyTrackingEvent(
                                'arrived', socket.currentRequestId,
                                donorUserId, hospUserId,
                                donorName, hospName
                            );
                            await hospitalSvc.logTrackingEvent(
                                socket.currentRequestId, null, null, 'arrived'
                            );
                        }
                    } catch (err) {
                        console.error('Arrival notification error:', err.message);
                    }
                }
                socket.currentRequestId = null;
            }
        } catch (err) {
            console.error('Live location update error:', err.message);
        }
    });

    // Hospital joins a tracking room to watch donors for a request
    socket.on('track:watch', (data) => {
        const { requestId } = data;
        if (socket.userRole !== 'hospital') return;
        socket.join(`request:${requestId}`);
        socket.currentRequestId = requestId;
        console.log(`Hospital ${socket.userId} watching request ${requestId}`);
    });

    // Hospitals can request a route to a donor
    socket.on('track:route', async (data) => {
        const { donorLat, donorLng, hospitalLat, hospitalLng } = data;
        try {
            const route = await osrmSvc.getRoute(donorLat, donorLng, hospitalLat, hospitalLng);
            socket.emit('donor:route', route);
        } catch {
            socket.emit('donor:route', null);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Socket disconnected: user ${socket.userId}`);
    });
});

// Make io accessible to route handlers
app.set('io', io);

// FIX: top-level `await` is not valid in CommonJS modules.
// Wrap everything in an async IIFE so we can await properly.
(async () => {
    try {
        // 1. Verify DB connection
        await db.query('SELECT 1');
        console.log('✅  Database connected');

        // 2. Run schema migrations
        await runMigrations();
        console.log('✅  Migrations complete');

        // 3. Seed default admin account (FIX: was placed outside async context)
        await createDefaultAdmin();

        // 4. Start HTTP server
        server.listen(PORT, () => {
            console.log(`\n\uD83D\uDCA5  BloodConnect API`);
            console.log(`    \u27A1  http://localhost:${PORT}`);
            console.log(`    \u27A1  Health: http://localhost:${PORT}/health`);
            console.log(`    \u27A1  Env: ${process.env.NODE_ENV || 'development'}\n`);
        });

    } catch (err) {
        console.error('❌  Startup failed:', err.message);
        process.exit(1);
    }
})();
