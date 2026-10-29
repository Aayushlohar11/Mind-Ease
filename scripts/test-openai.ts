/**
 * Test script for OpenAI integration and configuration
 */

import { generateChatResponse, isOpenAIConfigured } from '@backend/services/ai-chat.service'
import { env } from '@shared/lib/env'

async function testOpenAI() {
  console.log('🤖 Testing OpenAI Configuration & Chat Integration\n')
  console.log(`Configured: ${isOpenAIConfigured() ? '✅ YES' : '⚠️ NO (Using dev fallback)'}`)
  console.log(`Model: ${env.openai.model}\n`)

  const testMessage = 'Hello, I am testing the AI chat response.'
  console.log(`Sending message: "${testMessage}"...`)

  try {
    const response = await generateChatResponse(testMessage, [])
    if (response.success) {
      console.log('\n✅ Response received:')
      console.log(response.data)
      if (response.metadata?.tokensUsed) {
        console.log('\nTokens used:', response.metadata.tokensUsed)
      }
    } else {
      console.error('\n❌ Chat generation failed:', response.error)
    }
  } catch (error) {
    console.error('\n❌ Unexpected error testing OpenAI:', error)
  }
}

testOpenAI()
