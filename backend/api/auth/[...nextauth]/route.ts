/**
 * NextAuth API route handler
 */

import NextAuth from 'next-auth'
import { authOptions } from '@backend/auth/auth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
