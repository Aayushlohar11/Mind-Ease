/**
 * WebSocket API Route
 * Handles WebSocket connections via Socket.IO
 */

import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  // Socket.IO will handle the upgrade
  return new Response('WebSocket endpoint', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}

// Note: Actual WebSocket server initialization happens in server.ts
// This route is just a placeholder for Next.js routing
