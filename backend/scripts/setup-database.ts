/**
 * Database setup - runs initial migration SQL
 * Usage: npm run db:setup
 */

import fs from 'fs'
import path from 'path'
import { Pool } from 'pg'

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set in .env.local')
    console.error('Uncomment DATABASE_URL in .env.local to use PostgreSQL.')
    process.exit(1)
  }

  const migrationPath = path.join(__dirname, 'migrations', '001_initial_schema.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')

  const pool = new Pool({ connectionString: databaseUrl })
  try {
    await pool.query(sql)
    console.log('✓ Database schema applied successfully')
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error('Database setup failed:', err.message)
  process.exit(1)
})
