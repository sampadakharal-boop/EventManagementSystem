const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { createClient } = require('@libsql/client');

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const schemaPath = path.join(__dirname, 'database', 'schema.sql');
let databaseInitializationError = null;
const databaseReady = db.executeMultiple(fs.readFileSync(schemaPath, 'utf8'))
  .then(() => {
    console.log('Database schema is ready');
  })
  .catch((error) => {
    databaseInitializationError = error;
    console.error('Database schema initialization failed:', error);
  });

async function ensureDatabaseReady() {
  await databaseReady;
  if (databaseInitializationError) {
    throw databaseInitializationError;
  }
}

async function get(sql, args = []) {
  await ensureDatabaseReady();
  const result = await db.execute({ sql, args });
  return result.rows[0];
}

async function all(sql, args = []) {
  await ensureDatabaseReady();
  const result = await db.execute({ sql, args });
  return result.rows;
}

async function run(sql, args = []) {
  await ensureDatabaseReady();
  const result = await db.execute({ sql, args });
  return {
    lastInsertRowid:
      result.lastInsertRowid != null
        ? Number(result.lastInsertRowid)
        : null,
    changes: result.rowsAffected,
  };
}

module.exports = { db, databaseReady, get, all, run };
