/**
 * Health Check API Route
 * Provides system health status
 */

import { NextResponse } from 'next/server'
import { healthCheck as dbHealthCheck } from '@backend/lib/db'

export async function GET() {
  try {
    const startTime = Date.now()

    // Check database connection
    const dbHealthy = await dbHealthCheck()

    // Check environment variables
    const envHealthy = !!(
      process.env.NEXTAUTH_SECRET &&
      process.env.NEXTAUTH_URL
    )

    const responseTime = Date.now() - startTime

    const status = dbHealthy && envHealthy ? 'healthy' : 'degraded'

    return NextResponse.json(
      {
        status,
        timestamp: new Date().toISOString(),
        services: {
          database: dbHealthy ? 'up' : 'down',
          environment: envHealthy ? 'configured' : 'misconfigured',
        },
        responseTime: `${responseTime}ms`,
        version: process.env.npm_package_version || '0.1.0',
      },
      { status: status === 'healthy' ? 200 : 503 }
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
