// server.js
require('dotenv').config();

const http = require('http');
const app  = require('./app');
const db   = require('./config/db');
const { runMigrations }    = require('./database/migrate');
const createDefaultAdmin   = require('./services/adminSeeder');

const PORT   = process.env.PORT || 5000;
const server = http.createServer(app);

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
            console.log(`\n🩸  BloodConnect API`);
            console.log(`    ➜  http://localhost:${PORT}`);
            console.log(`    ➜  Health: http://localhost:${PORT}/health`);
            console.log(`    ➜  Env: ${process.env.NODE_ENV || 'development'}\n`);
        });

    } catch (err) {
        console.error('❌  Startup failed:', err.message);
        process.exit(1);
    }
})();
