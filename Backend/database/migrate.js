// database/migrate.js
// Runs any .sql files in database/migrations/ that haven't been applied yet.
// Tracks applied migrations in a `schema_migrations` table so each file
// runs exactly once. This prevents drift between the SQL files in the repo
// and what's actually been run against the live (Neon) database — which is
// what caused the "column units_received does not exist" 500 errors.

const fs   = require('fs');
const path = require('path');
const db   = require('../config/db');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

const ensureMigrationsTable = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            name        VARCHAR(255) PRIMARY KEY,
            applied_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
};

const runMigrations = async () => {
    await ensureMigrationsTable();

    const { rows } = await db.query('SELECT name FROM schema_migrations');
    const applied = new Set(rows.map((r) => r.name));

    const files = fs.existsSync(MIGRATIONS_DIR)
        ? fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort()
        : [];

    for (const file of files) {
        if (applied.has(file)) continue;

        const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
        console.log(`🔄 Applying migration: ${file}`);

        try {
            await db.query('BEGIN');
            await db.query(sql);
            await db.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
            await db.query('COMMIT');
            console.log(`✅ Applied migration: ${file}`);
        } catch (err) {
            await db.query('ROLLBACK');
            console.error(`❌ Migration failed: ${file} — ${err.message}`);
            throw err;
        }
    }
};

module.exports = { runMigrations };
