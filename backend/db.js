const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

let dbMode = 'sqlite';
let sqliteDb = null;
let tursoClient = null;

function initializeSQLite() {
    const Database = require('better-sqlite3');

    const dbPath = path.join(__dirname, 'database.db');

    console.log('DATABASE MODE: SQLite');
    console.log('DATABASE PATH:', dbPath);

    sqliteDb = new Database(dbPath);

    sqliteDb.pragma('foreign_keys = ON');

    createSQLiteTables();

    return sqliteDb;
}

function createSQLiteTables() {
    sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            category_id INTEGER,
            organizer TEXT,
            venue TEXT NOT NULL,
            city TEXT NOT NULL,
            address TEXT,
            event_date TEXT NOT NULL,
            event_time TEXT NOT NULL,
            end_date TEXT,
            end_time TEXT,
            image TEXT,
            capacity INTEGER DEFAULT 0,
            price REAL DEFAULT 0,
            event_type TEXT DEFAULT 'free',
            registration_deadline TEXT,
            contact_email TEXT,
            website TEXT,
            tags TEXT,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id)
                REFERENCES categories(id)
                ON DELETE SET NULL
        );

        CREATE INDEX IF NOT EXISTS idx_users_email
        ON users(email);

        CREATE INDEX IF NOT EXISTS idx_events_status
        ON events(status);

        CREATE INDEX IF NOT EXISTS idx_events_date
        ON events(event_date);
    `);

    console.log('SQLITE TABLES READY');
}

async function initializeTurso() {
    const { createClient } = require('@libsql/client');

    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
        throw new Error('TURSO_DATABASE_URL is missing.');
    }

    if (!authToken) {
        throw new Error('TURSO_AUTH_TOKEN is missing.');
    }

    console.log('DATABASE MODE: Turso / LibSQL');
    console.log('TURSO DATABASE:', url);

    tursoClient = createClient({
        url,
        authToken
    });

    await createTursoTables();

    return tursoClient;
}

async function createTursoTables() {
    await tursoClient.batch(
        [
            {
                sql: `
                    CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        email TEXT NOT NULL UNIQUE,
                        password TEXT NOT NULL,
                        role TEXT NOT NULL DEFAULT 'user',
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `
            },
            {
                sql: `
                    CREATE TABLE IF NOT EXISTS categories (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL UNIQUE,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `
            },
            {
                sql: `
                    CREATE TABLE IF NOT EXISTS events (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        title TEXT NOT NULL,
                        description TEXT NOT NULL,
                        category_id INTEGER,
                        organizer TEXT,
                        venue TEXT NOT NULL,
                        city TEXT NOT NULL,
                        address TEXT,
                        event_date TEXT NOT NULL,
                        event_time TEXT NOT NULL,
                        end_date TEXT,
                        end_time TEXT,
                        image TEXT,
                        capacity INTEGER DEFAULT 0,
                        price REAL DEFAULT 0,
                        event_type TEXT DEFAULT 'free',
                        registration_deadline TEXT,
                        contact_email TEXT,
                        website TEXT,
                        tags TEXT,
                        status TEXT DEFAULT 'active',
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `
            },
            {
                sql: `
                    CREATE INDEX IF NOT EXISTS idx_users_email
                    ON users(email)
                `
            },
            {
                sql: `
                    CREATE INDEX IF NOT EXISTS idx_events_status
                    ON events(status)
                `
            },
            {
                sql: `
                    CREATE INDEX IF NOT EXISTS idx_events_date
                    ON events(event_date)
                `
            }
        ],
        'write'
    );

    console.log('TURSO TABLES READY');
}

let initializationPromise;

async function initializeDatabase() {
    if (initializationPromise) {
        return initializationPromise;
    }

    initializationPromise = (async () => {
        if (
            isProduction &&
            process.env.TURSO_DATABASE_URL &&
            process.env.TURSO_AUTH_TOKEN
        ) {
            dbMode = 'turso';
            await initializeTurso();
            return;
        }

        dbMode = 'sqlite';
        initializeSQLite();
    })();

    return initializationPromise;
}

async function get(sql, params = []) {
    await initializeDatabase();

    if (dbMode === 'turso') {
        const result = await tursoClient.execute({
            sql,
            args: params
        });

        if (!result.rows || result.rows.length === 0) {
            return undefined;
        }

        return convertRow(result.rows[0]);
    }

    const statement = sqliteDb.prepare(sql);

    return statement.get(...params);
}

async function all(sql, params = []) {
    await initializeDatabase();

    if (dbMode === 'turso') {
        const result = await tursoClient.execute({
            sql,
            args: params
        });

        return (result.rows || []).map(convertRow);
    }

    const statement = sqliteDb.prepare(sql);

    return statement.all(...params);
}

async function run(sql, params = []) {
    await initializeDatabase();

    if (dbMode === 'turso') {
        const result = await tursoClient.execute({
            sql,
            args: params
        });

        return {
            changes: Number(result.rowsAffected || 0),
            lastInsertRowid: result.lastInsertRowid
                ? Number(result.lastInsertRowid)
                : null
        };
    }

    const statement = sqliteDb.prepare(sql);
    const result = statement.run(...params);

    return {
        changes: result.changes,
        lastInsertRowid: Number(result.lastInsertRowid)
    };
}

function convertRow(row) {
    if (!row) {
        return row;
    }

    const object = {};

    for (const key of Object.keys(row)) {
        object[key] = row[key];
    }

    return object;
}

async function healthCheck() {
    try {
        await initializeDatabase();

        await get('SELECT 1 AS ok');

        return {
            success: true,
            mode: dbMode
        };
    } catch (error) {
        console.error('DATABASE HEALTH CHECK ERROR:', error);

        return {
            success: false,
            mode: dbMode,
            error: error.message
        };
    }
}

module.exports = {
    get,
    all,
    run,
    healthCheck
};