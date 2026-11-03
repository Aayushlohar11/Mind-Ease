/**
 * Health Check API Route
 * Provides system health status
 */

import { NextResponse } from 'next/server'
import { healthCheck as dbHealthCheck, isDatabaseConfigured } from '@backend/db'

export async function GET() {
  try {
    const startTime = Date.now()

    // Check database connection (PostgreSQL when configured, otherwise in-memory mode)
    const dbConfigured = isDatabaseConfigured()
    const dbHealthy = dbConfigured ? await dbHealthCheck() : true

    // Check environment variables
    const envHealthy = !!(process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_URL)

    const responseTime = Date.now() - startTime

    const status = dbHealthy ? (envHealthy ? 'healthy' : 'degraded') : 'degraded'

    return NextResponse.json(
      {
        status,
        timestamp: new Date().toISOString(),
        services: {
          database: dbConfigured ? (dbHealthy ? 'postgres-up' : 'postgres-down') : 'in-memory-active',
          environment: envHealthy ? 'configured' : 'defaults-active',
        },
        responseTime: `${responseTime}ms`,
        version: process.env.npm_package_version || '0.1.0',
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}
