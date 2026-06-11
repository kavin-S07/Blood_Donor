require('dotenv').config();
const http = require('http');
const app  = require('./app');
const db   = require('./config/db');

const PORT   = process.env.PORT || 5000;
const server = http.createServer(app);

db.query('SELECT 1')
    .then(() => {
        server.listen(PORT, () => {
            console.log(`\n🩸 BloodConnect API`);
            console.log(`   ➜  http://localhost:${PORT}`);
            console.log(`   ➜  Health: http://localhost:${PORT}/health`);
            console.log(`   ➜  Env: ${process.env.NODE_ENV || 'development'}\n`);
        });
    })
    .catch((err) => {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
    });
