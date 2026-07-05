/**
 * Privacy Settings Page
 * Allows users to manage their privacy settings and data
 */

'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card } from '@frontend/components/ui/card'
import { Button } from '@frontend/components/ui/button'

export default function PrivacyPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  const handleExportData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/export')

      if (!response.ok) {
        throw new Error('Failed to export data')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `user-data-export-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alert('Data exported successfully!')
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE_MY_ACCOUNT') {
      alert('Please type DELETE_MY_ACCOUNT to confirm')
      return
    }

    if (!confirm('Are you absolutely sure? This action cannot be undone.')) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmation: 'DELETE_MY_ACCOUNT',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete account')
      }

      alert('Your account has been deleted. You will be redirected to the home page.')
      router.push('/')
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <p className="text-center text-gray-600">Please sign in to access privacy settings</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Privacy & Data Settings</h1>

      {/* Data Export */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Export Your Data</h2>
        <p className="text-gray-600 mb-4">
          Download a copy of all your data including mood entries, chat history, and preferences.
          This is provided in compliance with GDPR regulations.
        </p>
        <Button onClick={handleExportData} disabled={loading}>
          {loading ? 'Exporting...' : 'Export My Data'}
        </Button>
      </Card>

      {/* Privacy Information */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">How We Use Your Data</h2>
        <div className="space-y-3 text-gray-600">
          <p>
            <strong>Mood Entries:</strong> Stored securely to provide personalized insights and
            recommendations.
          </p>
          <p>
            <strong>Chat Messages:</strong> Used to improve AI responses and provide context-aware
            support.
          </p>
          <p>
            <strong>Analytics:</strong> Aggregated anonymously to improve our services.
          </p>
          <p>
            <strong>Encryption:</strong> All sensitive data is encrypted at rest and in transit.
          </p>
        </div>
      </Card>

      {/* Data Retention */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Data Retention</h2>
        <div className="space-y-3 text-gray-600">
          <p>
            We retain your data for as long as your account is active. You can delete your account
            and all associated data at any time.
          </p>
          <p>
            After account deletion, some anonymized data may be retained for up to 90 days for
            backup purposes, then permanently deleted.
          </p>
        </div>
      </Card>

      {/* Delete Account */}
      <Card className="p-6 border-red-200">
        <h2 className="text-xl font-semibold mb-4 text-red-600">Delete Account</h2>
        <p className="text-gray-600 mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Type <code className="bg-gray-100 px-2 py-1 rounded">DELETE_MY_ACCOUNT</code> to
              confirm:
            </label>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="DELETE_MY_ACCOUNT"
            />
          </div>

          <Button
            onClick={handleDeleteAccount}
            disabled={loading || deleteConfirmation !== 'DELETE_MY_ACCOUNT'}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Deleting...' : 'Delete My Account'}
          </Button>
        </div>
      </Card>

      {/* Contact */}
      <Card className="p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">Questions?</h2>
        <p className="text-gray-600">
          If you have any questions about your privacy or data, please contact us at{' '}
          <a href="mailto:privacy@example.com" className="text-blue-600 hover:underline">
            privacy@example.com
          </a>
        </p>
      </Card>
    </div>
  )
}
