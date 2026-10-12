/**
 * OTP Service
 * Handles OTP generation, storage, validation, and email sending
 */

import { Resend } from 'resend'

// Lazy-load Resend client
function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null
  }
  return new Resend(process.env.RESEND_API_KEY)
}

// In-memory OTP storage (in production, use Redis or database)
interface OTPRecord {
  code: string
  email: string
  expiresAt: Date
  attempts: number
  purpose: 'login' | 'signup' | 'verification'
}

const otpStore = new Map<string, OTPRecord>()

// Configuration
const OTP_LENGTH = 6
const OTP_EXPIRY_MINUTES = 10
const MAX_ATTEMPTS = 5
const RATE_LIMIT_MINUTES = 1 // Minimum time between OTP requests

// Rate limiting storage
const rateLimitStore = new Map<string, Date>()

/**
 * Generate a random OTP code
 */
function generateOTP(): string {
  const digits = '0123456789'
  let otp = ''
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)]
  }
  return otp
}

/**
 * Check if email is rate limited
 */
function isRateLimited(email: string): boolean {
  const lastRequest = rateLimitStore.get(email)
  if (!lastRequest) return false

  const now = new Date()
  const timeDiff = (now.getTime() - lastRequest.getTime()) / 1000 / 60 // in minutes

  return timeDiff < RATE_LIMIT_MINUTES
}

/**
 * Send OTP email via Resend
 */
async function sendOTPEmail(
  email: string,
  otp: string,
  purpose: 'login' | 'signup' | 'verification'
): Promise<boolean> {
  try {
    const purposeText = {
      login: 'Sign In',
      signup: 'Sign Up',
      verification: 'Verify Your Email',
    }

    const subject = `Your ${purposeText[purpose]} Code - Mind Ease`
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your OTP Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">🧠 Mind Ease</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Your AI Mental Health Companion</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1a202c; font-size: 24px; font-weight: 600;">Your Verification Code</h2>
              
              <p style="margin: 0 0 30px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Hi there! 👋<br><br>
                Use this code to ${purposeText[purpose].toLowerCase()} to your Mind Ease account:
              </p>
              
              <!-- OTP Code -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 30px 0;">
                <tr>
                  <td align="center" style="padding: 30px; background: linear-gradient(135deg, #f6f8ff 0%, #f0f4ff 100%); border-radius: 12px; border: 2px dashed #667eea;">
                    <div style="font-size: 48px; font-weight: 700; letter-spacing: 8px; color: #667eea; font-family: 'Courier New', monospace;">
                      ${otp}
                    </div>
                  </td>
                </tr>
              </table>
              
              <div style="background: #fff5f5; border-left: 4px solid #f56565; padding: 16px; border-radius: 8px; margin: 0 0 30px 0;">
                <p style="margin: 0; color: #742a2a; font-size: 14px; line-height: 1.5;">
                  ⏱️ <strong>This code expires in ${OTP_EXPIRY_MINUTES} minutes</strong><br>
                  🔒 Never share this code with anyone<br>
                  ❌ If you didn't request this, please ignore this email
                </p>
              </div>
              
              <p style="margin: 0; color: #718096; font-size: 14px; line-height: 1.6;">
                Having trouble? Just reply to this email and we'll help you out.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px 0; color: #718096; font-size: 14px;">
                This email was sent from <strong>Mind Ease</strong>
              </p>
              <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                Your mental health companion powered by AI
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `

    const resend = getResendClient()
    if (!resend) {
      console.warn('[OTP Service] RESEND_API_KEY is not set. Simulating OTP email delivery for:', email)
      return true
    }

    const { data, error } = await resend.emails.send({
      from: 'Mind Ease <onboarding@resend.dev>', // Use your verified domain in production
      to: email,
      subject,
      html,
    })

    if (error) {
      console.error('[OTP Service] Failed to send email:', error)
      return false
    }

    console.log('[OTP Service] Email sent successfully:', data?.id)
    return true
  } catch (error) {
    console.error('[OTP Service] Error sending OTP email:', error)
    return false
  }
}

/**
 * Generate and send OTP
 */
export async function generateAndSendOTP(
  email: string,
  purpose: 'login' | 'signup' | 'verification' = 'login'
): Promise<{
  success: boolean
  message: string
  expiresIn?: number
}> {
  try {
    // Validate email
    if (!email || !email.includes('@')) {
      return {
        success: false,
        message: 'Invalid email address',
      }
    }

    // Check rate limiting
    if (isRateLimited(email)) {
      return {
        success: false,
        message: `Please wait ${RATE_LIMIT_MINUTES} minute(s) before requesting another code`,
      }
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('[OTP Service] Resend API key not configured - using console output')
      
      // Development mode - just generate and log OTP
      const otp = generateOTP()
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

      // Store OTP
      otpStore.set(email, {
        code: otp,
        email,
        expiresAt,
        attempts: 0,
        purpose,
      })

      // Update rate limit
      rateLimitStore.set(email, new Date())

      console.log('\n' + '='.repeat(60))
      console.log('📧 OTP EMAIL (Development Mode)')
      console.log('='.repeat(60))
      console.log(`To: ${email}`)
      console.log(`Purpose: ${purpose}`)
      console.log(`Code: ${otp}`)
      console.log(`Expires: ${expiresAt.toLocaleString()}`)
      console.log('='.repeat(60) + '\n')

      return {
        success: true,
        message: 'OTP sent successfully (check console in development mode)',
        expiresIn: OTP_EXPIRY_MINUTES,
      }
    }

    // Generate OTP
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    // Send email
    const emailSent = await sendOTPEmail(email, otp, purpose)

    if (!emailSent) {
      return {
        success: false,
        message: 'Failed to send OTP email. Please try again.',
      }
    }

    // Store OTP
    otpStore.set(email, {
      code: otp,
      email,
      expiresAt,
      attempts: 0,
      purpose,
    })

    // Update rate limit
    rateLimitStore.set(email, new Date())

    return {
      success: true,
      message: 'OTP sent successfully to your email',
      expiresIn: OTP_EXPIRY_MINUTES,
    }
  } catch (error: any) {
    console.error('[OTP Service] Error generating OTP:', error)
    return {
      success: false,
      message: 'Failed to generate OTP. Please try again.',
    }
  }
}

/**
 * Verify OTP
 */
export async function verifyOTP(
  email: string,
  code: string
): Promise<{
  success: boolean
  message: string
}> {
  try {
    // Get stored OTP
    const otpRecord = otpStore.get(email)

    if (!otpRecord) {
      return {
        success: false,
        message: 'No OTP found. Please request a new one.',
      }
    }

    // Check expiration
    if (new Date() > otpRecord.expiresAt) {
      otpStore.delete(email)
      return {
        success: false,
        message: 'OTP has expired. Please request a new one.',
      }
    }

    // Check attempts
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      otpStore.delete(email)
      return {
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.',
      }
    }

    // Verify code
    if (otpRecord.code !== code) {
      otpRecord.attempts++
      otpStore.set(email, otpRecord)

      const remainingAttempts = MAX_ATTEMPTS - otpRecord.attempts
      return {
        success: false,
        message: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`,
      }
    }

    // Success - delete OTP
    otpStore.delete(email)
    rateLimitStore.delete(email)

    return {
      success: true,
      message: 'OTP verified successfully',
    }
  } catch (error: any) {
    console.error('[OTP Service] Error verifying OTP:', error)
    return {
      success: false,
      message: 'Failed to verify OTP. Please try again.',
    }
  }
}

/**
 * Clean up expired OTPs (call periodically)
 */
export function cleanupExpiredOTPs(): void {
  const now = new Date()
  for (const [email, record] of otpStore.entries()) {
    if (now > record.expiresAt) {
      otpStore.delete(email)
    }
  }
}

// Clean up expired OTPs every 5 minutes
setInterval(cleanupExpiredOTPs, 5 * 60 * 1000)
