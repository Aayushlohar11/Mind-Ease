/**
 * Database Connection Test Script
 * Tests PostgreSQL connection and basic operations
 */

import { testConnection, initializeDatabase, healthCheck, query, closePool } from '../lib/database'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

async function testDatabase() {
  console.log('\n🔍 Testing Database Connection...\n')

  try {
    // Test 1: Basic Connection
    console.log('Test 1: Basic Connection')
    const connected = await testConnection()
    
    if (!connected) {
      console.error('❌ Failed to connect to database')
      console.log('\n📝 Troubleshooting:')
      console.log('   1. Check if PostgreSQL is running')
      console.log('   2. Verify DATABASE_URL in .env.local')
      console.log('   3. Ensure database exists: createdb mindease_db')
      console.log('   4. Run schema: psql -d mindease_db -f database/schema.sql')
      process.exit(1)
    }

    // Test 2: Health Check
    console.log('\nTest 2: Health Check')
    const health = await healthCheck()
    console.log('   Status:', health.status)
    console.log('   Pool Size:', health.details.poolSize)
    console.log('   Idle Connections:', health.details.idleConnections)
    console.log('   Waiting Clients:', health.details.waitingClients)

    if (health.status === 'unhealthy') {
      console.error('❌ Database is unhealthy')
      process.exit(1)
    }

    // Test 3: Check Tables
    console.log('\nTest 3: Checking Tables')
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `)

    if (tablesResult.rows.length === 0) {
      console.error('❌ No tables found')
      console.log('\n📝 Run schema migration:')
      console.log('   psql -d mindease_db -f database/schema.sql')
      process.exit(1)
    }

    console.log(`   ✅ Found ${tablesResult.rows.length} tables:`)
    tablesResult.rows.forEach((row: any) => {
      console.log(`      - ${row.table_name}`)
    })

    // Test 4: Test CRUD Operations
    console.log('\nTest 4: Testing CRUD Operations')
    
    // Insert test user
    const testEmail = `test_${Date.now()}@example.com`
    const insertResult = await query(`
      INSERT INTO users (email, name, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, email, name
    `, [testEmail, 'Test User', 'test_hash'])

    const testUser = insertResult.rows[0]
    console.log('   ✅ INSERT: Created test user:', testUser.email)

    // Read test user
    const selectResult = await query(`
      SELECT id, email, name FROM users WHERE id = $1
    `, [testUser.id])

    if (selectResult.rows.length > 0) {
      console.log('   ✅ SELECT: Retrieved test user:', selectResult.rows[0].email)
    }

    // Update test user
    await query(`
      UPDATE users SET name = $1 WHERE id = $2
    `, ['Updated Test User', testUser.id])
    console.log('   ✅ UPDATE: Updated test user name')

    // Delete test user
    await query(`
      DELETE FROM users WHERE id = $1
    `, [testUser.id])
    console.log('   ✅ DELETE: Deleted test user')

    // Test 5: Test Indexes
    console.log('\nTest 5: Checking Indexes')
    const indexResult = await query(`
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `)

    console.log(`   ✅ Found ${indexResult.rows.length} indexes`)

    // Test 6: Test Views
    console.log('\nTest 6: Checking Views')
    const viewResult = await query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)

    if (viewResult.rows.length > 0) {
      console.log(`   ✅ Found ${viewResult.rows.length} views:`)
      viewResult.rows.forEach((row: any) => {
        console.log(`      - ${row.table_name}`)
      })
    } else {
      console.log('   ⚠️ No views found')
    }

    // Test 7: Test Functions
    console.log('\nTest 7: Checking Functions')
    const functionResult = await query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public'
      AND routine_type = 'FUNCTION'
      ORDER BY routine_name
    `)

    if (functionResult.rows.length > 0) {
      console.log(`   ✅ Found ${functionResult.rows.length} functions:`)
      functionResult.rows.forEach((row: any) => {
        console.log(`      - ${row.routine_name}`)
      })
    } else {
      console.log('   ⚠️ No functions found')
    }

    // Test 8: Database Statistics
    console.log('\nTest 8: Database Statistics')
    const statsResult = await query(`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as database_size,
        (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count,
        (SELECT count(*) FROM information_schema.views WHERE table_schema = 'public') as view_count
    `)

    const stats = statsResult.rows[0]
    console.log('   Database Size:', stats.database_size)
    console.log('   Tables:', stats.table_count)
    console.log('   Views:', stats.view_count)

    // Test 9: Connection Pool Stats
    console.log('\nTest 9: Connection Pool Statistics')
    const poolHealth = await healthCheck()
    console.log('   Total Connections:', poolHealth.details.poolSize)
    console.log('   Idle Connections:', poolHealth.details.idleConnections)
    console.log('   Active Connections:', poolHealth.details.poolSize - poolHealth.details.idleConnections)
    console.log('   Waiting Clients:', poolHealth.details.waitingClients)

    // Success!
    console.log('\n✅ All database tests passed!')
    console.log('\n🎉 Database is ready for use!')
    console.log('\nNext steps:')
    console.log('   1. Start your application: npm run dev')
    console.log('   2. Test features in the browser')
    console.log('   3. Monitor database performance')

  } catch (error) {
    console.error('\n❌ Database test failed:', error)
    console.log('\n📝 Troubleshooting:')
    console.log('   1. Check PostgreSQL is running')
    console.log('   2. Verify connection string in .env.local')
    console.log('   3. Ensure database exists')
    console.log('   4. Run schema migration')
    console.log('   5. Check PostgreSQL logs')
    process.exit(1)
  } finally {
    // Close pool
    await closePool()
  }
}

// Run tests
testDatabase().catch((error) => {
  console.error('Unexpected error:', error)
  process.exit(1)
})
