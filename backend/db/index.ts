/**
 * Database connection and query utilities
 * Provides PostgreSQL connection pooling and query execution
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg'

// Database configuration from environment variables
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  min: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
  max: parseInt(process.env.DATABASE_POOL_MAX || '10', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
}

// Persist connection pool on globalThis across hot-reloads in development
const globalForPg = globalThis as typeof globalThis & {
  __mindeaseDbPool?: Pool
}

/** True when DATABASE_URL is set (PostgreSQL available) */
export function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL?.trim()
}

/**
 * Get or create database connection pool
 */
export function getPool(): Pool {
  if (!globalForPg.__mindeaseDbPool) {
    const pool = new Pool(dbConfig)

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle database client', err)
    })

    // Log pool connection
    pool.on('connect', () => {
      console.log('New database connection established')
    })

    globalForPg.__mindeaseDbPool = pool
  }

  return globalForPg.__mindeaseDbPool
}

/**
 * Execute a query with parameters
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_URL is not configured')
  }
  const pool = getPool()
  const start = Date.now()

  try {
    const result = await pool.query<T>(text, params)
    const duration = Date.now() - start

    // Log slow queries (> 1 second)
    if (duration > 1000) {
      console.warn('Slow query detected:', {
        text: text.substring(0, 100),
        duration,
        rows: result.rowCount,
      })
    }

    return result
  } catch (error) {
    console.error('Database query error:', {
      text: text.substring(0, 100),
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<PoolClient> {
  const pool = getPool()
  return await pool.connect()
}

/**
 * Execute a transaction
 */
export async function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getClient()

  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/**
 * Close all database connections
 */
export async function closePool(): Promise<void> {
  if (globalForPg.__mindeaseDbPool) {
    await globalForPg.__mindeaseDbPool.end()
    globalForPg.__mindeaseDbPool = undefined
    console.log('Database pool closed')
  }
}

/**
 * Check database connection health
 */
export async function healthCheck(): Promise<boolean> {
  if (!isDatabaseConfigured()) {
    return false
  }
  try {
    const result = await query('SELECT NOW()')
    return result.rowCount !== null && result.rowCount > 0
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}

/**
 * Execute multiple queries in a transaction
 */
export async function batchQuery(
  queries: Array<{ text: string; params?: any[] }>
): Promise<QueryResult[]> {
  return transaction(async (client) => {
    const results: QueryResult[] = []

    for (const q of queries) {
      const result = await client.query(q.text, q.params)
      results.push(result)
    }

    return results
  })
}

/**
 * Database query builder helpers
 * Merged from lib/database.ts — provides a simple CRUD API on top of the pool.
 */
export const db = {
  /**
   * Select query helper
   */
  select: async <T extends QueryResultRow = any>(
    table: string,
    columns: string[] = ['*'],
    where?: { [key: string]: any },
    orderBy?: string,
    limit?: number
  ): Promise<T[]> => {
    let sql = `SELECT ${columns.join(', ')} FROM ${table}`
    const params: any[] = []
    let paramIndex = 1

    if (where && Object.keys(where).length > 0) {
      const conditions = Object.keys(where).map((key) => {
        params.push(where[key])
        return `${key} = $${paramIndex++}`
      })
      sql += ` WHERE ${conditions.join(' AND ')}`
    }

    if (orderBy) {
      sql += ` ORDER BY ${orderBy}`
    }

    if (limit) {
      sql += ` LIMIT ${limit}`
    }

    const result = await query<T>(sql, params)
    return result.rows
  },

  /**
   * Insert query helper
   */
  insert: async <T extends QueryResultRow = any>(
    table: string,
    data: { [key: string]: any }
  ): Promise<T> => {
    const keys = Object.keys(data)
    const values = Object.values(data)
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')

    const sql = `
      INSERT INTO ${table} (${keys.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `

    const result = await query<T>(sql, values)
    return result.rows[0]
  },

  /**
   * Update query helper
   */
  update: async <T extends QueryResultRow = any>(
    table: string,
    data: { [key: string]: any },
    where: { [key: string]: any }
  ): Promise<T> => {
    const dataKeys = Object.keys(data)
    const dataValues = Object.values(data)
    const whereKeys = Object.keys(where)
    const whereValues = Object.values(where)

    const setClause = dataKeys.map((key, i) => `${key} = $${i + 1}`).join(', ')

    const whereClause = whereKeys
      .map((key, i) => `${key} = $${dataKeys.length + i + 1}`)
      .join(' AND ')

    const sql = `
      UPDATE ${table}
      SET ${setClause}
      WHERE ${whereClause}
      RETURNING *
    `

    const result = await query<T>(sql, [...dataValues, ...whereValues])
    return result.rows[0]
  },

  /**
   * Delete query helper
   */
  delete: async (table: string, where: { [key: string]: any }): Promise<number> => {
    const keys = Object.keys(where)
    const values = Object.values(where)
    const conditions = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ')

    const sql = `DELETE FROM ${table} WHERE ${conditions}`

    const result = await query(sql, values)
    return result.rowCount || 0
  },

  /**
   * Count query helper
   */
  count: async (table: string, where?: { [key: string]: any }): Promise<number> => {
    let sql = `SELECT COUNT(*) as count FROM ${table}`
    const params: any[] = []

    if (where && Object.keys(where).length > 0) {
      const conditions = Object.keys(where).map((key, i) => {
        params.push(where[key])
        return `${key} = $${i + 1}`
      })
      sql += ` WHERE ${conditions.join(' AND ')}`
    }

    const result = await query<{ count: string }>(sql, params)
    return parseInt(result.rows[0].count)
  },

  /**
   * Check if record exists
   */
  exists: async (table: string, where: { [key: string]: any }): Promise<boolean> => {
    const count = await db.count(table, where)
    return count > 0
  },
}

/**
 * Test database connection (convenience wrapper)
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW() as current_time')
    console.log('✅ Database connection successful:', result.rows[0].current_time)
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}

/**
 * Initialize database — check if tables exist
 */
export async function initializeDatabase(): Promise<void> {
  if (!isDatabaseConfigured()) {
    console.warn('⚠️ DATABASE_URL is not configured — skipping initialization')
    return
  }
  try {
    console.log('🔄 Initializing database...')
    const tablesExist = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      ) as exists
    `)
    if (!tablesExist.rows[0].exists) {
      console.log('⚠️ Please run database/schema.sql manually to create tables')
    } else {
      console.log('✅ Database tables already exist')
    }
    await testConnection()
    console.log('✅ Database initialized successfully')
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  }
}

// Export types
export type { Pool, PoolClient, QueryResult }
