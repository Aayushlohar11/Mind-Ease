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

// Create connection pool
let pool: Pool | null = null

/** True when DATABASE_URL is set (PostgreSQL available) */
export function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL?.trim()
}

/**
 * Get or create database connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(dbConfig)

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle database client', err)
    })

    // Log pool connection
    pool.on('connect', () => {
      console.log('New database connection established')
    })
  }

  return pool
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
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
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
  if (pool) {
    await pool.end()
    pool = null
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
