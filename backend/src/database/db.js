const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

let pgPool = null;
let sqlJsDb = null;
let activeEngine = 'detecting'; // 'pg' or 'sqljs'
const DB_FILE_PATH = path.join(__dirname, 'smart_parking_local.db');

// Build PostgreSQL connection pool configuration
function getPgPoolConfig() {
  if (process.env.DATABASE_URL) {
    const isSslDisabled = process.env.DB_SSL === 'false';
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: isSslDisabled ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    };
  }

  const isSslRequired = process.env.DB_SSL === 'true';
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'smart_parking_db',
    ssl: isSslRequired ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 3000,
    idleTimeoutMillis: 10000,
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  };
}

// Mask credentials for safe logging
function getSanitizedDbTarget() {
  if (process.env.DATABASE_URL) {
    try {
      const parsed = new URL(process.env.DATABASE_URL);
      return `${parsed.protocol}//${parsed.username || 'user'}:****@${parsed.host}${parsed.pathname}`;
    } catch {
      return 'DATABASE_URL (configured)';
    }
  }
  return `${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || '5432'} (db: ${process.env.DB_NAME || 'smart_parking_db'})`;
}

let inTransaction = false;

// Helper: Save sql.js database buffer to disk
function persistSqlJs() {
  if (sqlJsDb && activeEngine === 'sqljs' && !inTransaction) {
    try {
      const data = sqlJsDb.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_FILE_PATH, buffer);
    } catch (err) {
      console.error('[DB] Failed to persist embedded database:', err.message);
    }
  }
}

// Initialize database
async function initDatabase() {
  if (activeEngine !== 'detecting' && (pgPool || sqlJsDb)) {
    return;
  }

  // If not explicitly forced to embedded DB, attempt PostgreSQL connection
  if (process.env.USE_EMBEDDED_DB !== 'true') {
    try {
      const sanitizedTarget = getSanitizedDbTarget();
      console.log(`[DB] Attempting connection to PostgreSQL at ${sanitizedTarget}...`);
      const poolConfig = getPgPoolConfig();
      const testPool = new Pool(poolConfig);

      testPool.on('error', (err) => {
        console.error('[DB] Unexpected error on idle PostgreSQL client:', err.message);
      });

      const res = await testPool.query('SELECT 1 as connected');
      if (res.rows && res.rows.length > 0) {
        pgPool = testPool;
        activeEngine = 'pg';
        console.log('[DB] Successfully connected to PostgreSQL server.');
        return;
      }
    } catch (err) {
      console.warn(`[DB] PostgreSQL connection not established (${err.message}). Activating embedded database engine...`);
    }
  }

  // Fallback to SQL.js embedded database
  activeEngine = 'sqljs';
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_FILE_PATH)) {
    const fileBuffer = fs.readFileSync(DB_FILE_PATH);
    sqlJsDb = new SQL.Database(fileBuffer);
    console.log('[DB] Loaded existing embedded database from file.');
  } else {
    sqlJsDb = new SQL.Database();
    console.log('[DB] Initialized new embedded database.');
  }
}

/**
 * Universal query runner:
 * Accepts standard PostgreSQL syntax: query("SELECT * FROM users WHERE id = $1", [id])
 * Returns { rows: [...], rowCount: n }
 */
async function query(text, params = []) {
  if (activeEngine === 'detecting') {
    await initDatabase();
  }

  if (activeEngine === 'pg' && pgPool) {
    try {
      return await pgPool.query(text, params);
    } catch (error) {
      console.error('[PG Query Error]:', error.message, '\nQuery:', text);
      throw error;
    }
  }

  // SQL.js implementation with Postgres syntax compatibility
  if (activeEngine === 'sqljs' && sqlJsDb) {
    try {
      // 1. Transform PostgreSQL RETURNING clause if present
      const returningMatch = text.match(/RETURNING\s+([a-zA-Z0-9_*,\s]+)$/i);
      let returningCols = returningMatch ? returningMatch[1].trim() : null;
      let cleanQuery = text.replace(/RETURNING\s+([a-zA-Z0-9_*,\s]+)$/i, '').trim();

      // 2. Transform $1, $2 to ? for SQLite
      cleanQuery = cleanQuery.replace(/\$(\d+)/g, '?');

      // 3. Remove PostgreSQL specific casts like ::jsonb, ::int, etc.
      cleanQuery = cleanQuery.replace(/::[a-zA-Z0-9_]+/g, '');

      // 4. Format boolean params to 1 or 0 for SQLite
      const mappedParams = params.map(val => {
        if (typeof val === 'boolean') return val ? 1 : 0;
        if (val instanceof Date) return val.toISOString();
        if (val && typeof val === 'object' && !(val instanceof Buffer)) return JSON.stringify(val);
        return val;
      });

      // Execute query
      const isSelect = /^\s*SELECT/i.test(cleanQuery);

      if (isSelect) {
        const stmt = sqlJsDb.prepare(cleanQuery);
        stmt.bind(mappedParams);
        const rows = [];
        while (stmt.step()) {
          const rowObj = stmt.getAsObject();
          // Normalize boolean columns if any
          rows.push(rowObj);
        }
        stmt.free();
        return { rows, rowCount: rows.length };
      } else {
        // INSERT / UPDATE / DELETE
        sqlJsDb.run(cleanQuery, mappedParams);
        persistSqlJs();

        let rows = [];
        if (returningCols) {
          // Fetch the last inserted or updated record
          const lastIdRes = sqlJsDb.exec("SELECT last_insert_rowid() as id;");
          const lastId = lastIdRes[0]?.values[0]?.[0];
          if (lastId && /^\s*INSERT/i.test(cleanQuery)) {
            // Determine table name
            const tableMatch = cleanQuery.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)/i);
            if (tableMatch) {
              const tableName = tableMatch[1];
              const fetchStmt = sqlJsDb.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
              fetchStmt.bind([lastId]);
              if (fetchStmt.step()) {
                rows.push(fetchStmt.getAsObject());
              }
              fetchStmt.free();
            }
          }
        }

        const changesRes = sqlJsDb.exec("SELECT changes();");
        const rowCount = changesRes[0]?.values[0]?.[0] || 1;
        return { rows, rowCount };
      }
    } catch (err) {
      console.error('[SQL.js Query Error]:', err.message, '\nQuery:', text);
      throw err;
    }
  }

  throw new Error('[DB] No database engine available.');
}

/**
 * Universal Transaction Wrapper
 */
async function transaction(callback) {
  if (activeEngine === 'detecting') {
    await initDatabase();
  }

  if (activeEngine === 'pg' && pgPool) {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  if (activeEngine === 'sqljs' && sqlJsDb) {
    inTransaction = true;
    sqlJsDb.run("BEGIN TRANSACTION;");
    try {
      const client = {
        query: async (text, params) => query(text, params)
      };
      const result = await callback(client);
      sqlJsDb.run("COMMIT;");
      inTransaction = false;
      persistSqlJs();
      return result;
    } catch (err) {
      sqlJsDb.run("ROLLBACK;");
      inTransaction = false;
      throw err;
    }
  }

  throw new Error('[DB] Database not initialized for transaction.');
}

async function closeDatabase() {
  if (pgPool) {
    try {
      await pgPool.end();
      console.log('[DB] PostgreSQL pool closed.');
    } catch (err) {
      console.error('[DB] Error closing PG pool:', err.message);
    }
  }
  if (sqlJsDb) {
    persistSqlJs();
    console.log('[DB] Embedded database persisted.');
  }
}

module.exports = {
  query,
  transaction,
  initDatabase,
  closeDatabase,
  persistSqlJs,
  getActiveEngine: () => activeEngine,
};
