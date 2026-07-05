/**
 * Custom Next.js Server with WebSocket Support
 * Integrates Socket.IO with Next.js
 */

import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { initializeWebSocketServer } from './lib/websocket-server'

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('Internal server error')
    }
  })

  // Initialize WebSocket server
  const io = initializeWebSocketServer(server)
  console.log('✅ WebSocket server initialized')

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log(`> WebSocket ready on ws://${hostname}:${port}/api/socket`)
  })

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server')
    server.close(() => {
      console.log('HTTP server closed')
      io.close()
      process.exit(0)
    })
  })
})
