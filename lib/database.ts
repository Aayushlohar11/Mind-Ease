/**
 * Database Connection and Query Service
 * PostgreSQL database connection pool and query utilities
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg'

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'mindease_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: parseInt(process.env.DB_POOL_MAX || '20'), // Maximum pool size
  min: parseInt(process.env.DB_POOL_MIN || '2'), // Minimum pool size
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return error after 10 seconds if connection not established
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
}

// Create connection pool
let pool: Pool | null = null

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
    console.log('✅ Database pool created')
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
  const pool = getPool()
  const start = Date.now()

  try {
    const result = await pool.query<T>(text, params)
    const duration = Date.now() - start

    // Log slow queries (> 1 second)
    if (duration > 1000) {
      console.warn(`⚠️ Slow query (${duration}ms):`, text.substring(0, 100))
    }

    return result
  } catch (error) {
    console.error('Database query error:', error)
    console.error('Query:', text)
    console.error('Params:', params)
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
 * Execute multiple queries in a transaction
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
    console.log('✅ Database pool closed')
  }
}

/**
 * Test database connection
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
 * Initialize database (run migrations)
 */
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('🔄 Initializing database...')

    // Check if tables exist
    const tablesExist = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      ) as exists
    `)

    if (!tablesExist.rows[0].exists) {
      console.log('📦 Running database migrations...')
      // In production, use a proper migration tool like node-pg-migrate or Prisma
      // For now, we'll assume schema.sql has been run manually
      console.log('⚠️ Please run database/schema.sql manually to create tables')
    } else {
      console.log('✅ Database tables already exist')
    }

    // Test connection
    await testConnection()

    console.log('✅ Database initialized successfully')
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  }
}

/**
 * Database query builder helpers
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

    const setClause = dataKeys
      .map((key, i) => `${key} = $${i + 1}`)
      .join(', ')

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
  delete: async (
    table: string,
    where: { [key: string]: any }
  ): Promise<number> => {
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
  count: async (
    table: string,
    where?: { [key: string]: any }
  ): Promise<number> => {
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
  exists: async (
    table: string,
    where: { [key: string]: any }
  ): Promise<boolean> => {
    const count = await db.count(table, where)
    return count > 0
  },
}

/**
 * Database health check
 */
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy'
  details: {
    connected: boolean
    poolSize: number
    idleConnections: number
    waitingClients: number
  }
}> {
  try {
    const pool = getPool()
    await query('SELECT 1')

    return {
      status: 'healthy',
      details: {
        connected: true,
        poolSize: pool.totalCount,
        idleConnections: pool.idleCount,
        waitingClients: pool.waitingCount,
      },
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      details: {
        connected: false,
        poolSize: 0,
        idleConnections: 0,
        waitingClients: 0,
      },
    }
  }
}

/**
 * Clean up expired data (run periodically)
 */
export async function cleanupExpiredData(): Promise<void> {
  try {
    console.log('🧹 Cleaning up expired data...')

    // Clean up expired analytics
    await query('DELETE FROM analytics_data WHERE expires_at < NOW()')

    // Clean up expired recommendations
    await query('DELETE FROM recommendations WHERE expires_at < NOW()')

    // Clean up expired insights
    await query('DELETE FROM insights WHERE expires_at < NOW()')

    // Clean up old audit logs (keep last 90 days)
    await query(`
      DELETE FROM audit_logs 
      WHERE timestamp < NOW() - INTERVAL '90 days'
    `)

    console.log('✅ Expired data cleaned up')
  } catch (error) {
    console.error('❌ Failed to clean up expired data:', error)
  }
}

// Export types
export type { Pool, PoolClient, QueryResult }
