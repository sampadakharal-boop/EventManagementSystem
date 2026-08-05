require('dotenv').config();
const { createClient } = require('@libsql/client');

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function get(sql, args = []) {
  const result = await db.execute({ sql, args });
  return result.rows[0];
}

async function all(sql, args = []) {
  const result = await db.execute({ sql, args });
  return result.rows;
}

console.log("✅ Database connected successfully");

async function run(sql, args = []) {
  const result = await db.execute({ sql, args });
  return {
    lastInsertRowid:
      result.lastInsertRowid != null
        ? Number(result.lastInsertRowid)
        : null,
    changes: result.rowsAffected,
  };
}

module.exports = { db, get, all, run };