import { describe, it, expect, beforeEach } from 'vitest'
import { generateAndSendOTP, verifyOTP, cleanupExpiredOTPs } from './otp.service'

describe('OTP Service', () => {
  beforeEach(() => {
    cleanupExpiredOTPs()
  })

  it('should reject invalid email formats', async () => {
    const result = await generateAndSendOTP('invalid-email')
    expect(result.success).toBe(false)
    expect(result.message).toContain('Invalid email')
  })

  it('should generate devOtp in test/dev environment', async () => {
    const uniqueEmail = `test_${Date.now()}@example.com`
    const result = await generateAndSendOTP(uniqueEmail, 'login')

    expect(result.success).toBe(true)
    expect(result.devOtp).toBeDefined()
    expect(result.devOtp).toMatch(/^\d{6}$/)
  })

  it('should verify correct OTP code', async () => {
    const uniqueEmail = `verify_${Date.now()}@example.com`
    const sendResult = await generateAndSendOTP(uniqueEmail, 'signup')

    expect(sendResult.success).toBe(true)
    const code = sendResult.devOtp!

    const verifyResult = await verifyOTP(uniqueEmail, code)
    expect(verifyResult.success).toBe(true)
    expect(verifyResult.message).toContain('verified')
  })

  it('should accept developer bypass code in development/testing', async () => {
    const uniqueEmail = `bypass_${Date.now()}@example.com`
    const verifyResult = await verifyOTP(uniqueEmail, '123456')
    expect(verifyResult.success).toBe(true)
  })

  it('should reject incorrect OTP code', async () => {
    const uniqueEmail = `wrong_${Date.now()}@example.com`
    await generateAndSendOTP(uniqueEmail, 'login')

    const verifyResult = await verifyOTP(uniqueEmail, '888888')
    expect(verifyResult.success).toBe(false)
    expect(verifyResult.message).toContain('Invalid OTP')
  })

  it('should reject non-existent OTP requests with non-bypass code', async () => {
    const verifyResult = await verifyOTP('nobody@example.com', '888888')
    expect(verifyResult.success).toBe(false)
    expect(verifyResult.message).toContain('No OTP found')
  })
})
