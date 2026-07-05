/**
 * User Data Deletion API Route
 * Allows users to delete their account and all data (GDPR compliance)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@backend/lib/auth'
import { deleteUser } from '@backend/services/user.service'
import { query } from '@backend/lib/db'

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth(request)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Verify user wants to delete (require confirmation)
    const body = await request.json()
    if (body.confirmation !== 'DELETE_MY_ACCOUNT') {
      return NextResponse.json(
        { error: 'Confirmation required. Please send { confirmation: "DELETE_MY_ACCOUNT" }' },
        { status: 400 }
      )
    }

    // Delete all user data
    await deleteAllUserData(userId)

    return NextResponse.json({
      success: true,
      message: 'Account and all associated data have been permanently deleted',
    })
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete account',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Delete all user data from database
 */
async function deleteAllUserData(userId: string): Promise<void> {
  try {
    // Delete in order to respect foreign key constraints
    await query('DELETE FROM content_interactions WHERE user_id = $1', [userId])
    await query('DELETE FROM messages WHERE user_id = $1', [userId])
    await query('DELETE FROM chat_sessions WHERE user_id = $1', [userId])
    await query('DELETE FROM mood_entries WHERE user_id = $1', [userId])
    await query('DELETE FROM user_preferences WHERE user_id = $1', [userId])
    await query('DELETE FROM users WHERE id = $1', [userId])

    console.log(`Successfully deleted all data for user ${userId}`)
  } catch (error) {
    console.error('Error deleting user data:', error)
    throw error
  }
}
