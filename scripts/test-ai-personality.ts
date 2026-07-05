/**
 * Test script for AI personality enhancements
 * Tests the human-like, creative, and empathetic responses
 */

import { generateChatResponse, createMessage } from '../backend/services/ai-chat.service'
import type { Message } from '../backend/types/message'

// Test scenarios to verify human-like personality
const testScenarios = [
  {
    name: 'Greeting Test',
    message: 'Hi there',
    expectedTraits: ['warm', 'welcoming', 'introduces self', 'asks how user is doing'],
  },
  {
    name: 'Sadness/Depression Test',
    message: "I've been feeling really down lately. Everything just feels hopeless.",
    expectedTraits: ['empathetic', 'validating', 'gentle', 'offers support', 'no toxic positivity'],
  },
  {
    name: 'Anxiety Test',
    message: "I'm so anxious right now, my heart is racing and I can't stop worrying.",
    expectedTraits: ['calming', 'grounding techniques', 'immediate help', 'reassuring'],
  },
  {
    name: 'Happiness Test',
    message: "I'm feeling really good today! Things are finally looking up.",
    expectedTraits: ['celebrates', 'enthusiastic', 'helps savor moment', 'positive'],
  },
  {
    name: 'Confusion Test',
    message: "I don't know what to do. I feel so lost and stuck.",
    expectedTraits: ['patient', 'helps untangle thoughts', 'asks clarifying questions'],
  },
  {
    name: 'Anger Test',
    message: "I'm so frustrated and angry right now! Nothing is going right.",
    expectedTraits: ['validates anger', 'explores underlying feelings', 'non-defensive'],
  },
]

async function testAIPersonality() {
  console.log('🧪 Testing AI Personality Enhancements\n')
  console.log('=' .repeat(80))
  console.log('\n')

  for (const scenario of testScenarios) {
    console.log(`\n📝 ${scenario.name}`)
    console.log('-'.repeat(80))
    console.log(`\n👤 User: "${scenario.message}"\n`)

    try {
      const response = await generateChatResponse(scenario.message, [])

      if (response.success && response.data) {
        console.log(`🤖 Alex: ${response.data}\n`)
        console.log(`✅ Response generated successfully`)
        console.log(`📊 Metadata:`)
        console.log(`   - Model: ${response.metadata?.model}`)
        console.log(`   - Processing Time: ${response.metadata?.processingTime}ms`)
        if (response.metadata?.tokensUsed) {
          console.log(`   - Tokens Used: ${response.metadata.tokensUsed.total}`)
        }
        console.log(`\n🎯 Expected Traits: ${scenario.expectedTraits.join(', ')}`)
      } else {
        console.log(`❌ Error: ${response.error?.message}`)
        console.log(`   Code: ${response.error?.code}`)
      }
    } catch (error: any) {
      console.log(`❌ Unexpected Error: ${error.message}`)
    }

    console.log('\n' + '='.repeat(80))
    
    // Wait a bit between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('\n\n✨ Testing Complete!\n')
  console.log('Review the responses above to verify:')
  console.log('  ✓ Natural, conversational language')
  console.log('  ✓ Varied sentence structure')
  console.log('  ✓ Appropriate use of emojis')
  console.log('  ✓ Empathetic and validating tone')
  console.log('  ✓ Creative and thoughtful responses')
  console.log('  ✓ Human-like personality (Alex)')
  console.log('  ✓ Context-appropriate emotional responses')
  console.log('\n')
}

// Test conversation continuity
async function testConversationContinuity() {
  console.log('\n\n🔄 Testing Conversation Continuity\n')
  console.log('=' .repeat(80))

  const conversationHistory: Message[] = []
  const sessionId = 'test_session_' + Date.now()

  const conversationFlow = [
    "Hi, I'm feeling anxious",
    "It's about my job. I'm worried I'm not good enough.",
    "Yeah, I guess I do tend to be hard on myself.",
    "That's a good point. Maybe I should focus on what I've accomplished.",
  ]

  for (let i = 0; i < conversationFlow.length; i++) {
    const userMessage = conversationFlow[i]
    console.log(`\n👤 User (Message ${i + 1}): "${userMessage}"`)

    // Add user message to history
    conversationHistory.push(
      createMessage(userMessage, 'user', sessionId)
    )

    try {
      const response = await generateChatResponse(userMessage, conversationHistory)

      if (response.success && response.data) {
        console.log(`\n🤖 Alex: ${response.data}`)

        // Add AI response to history
        conversationHistory.push(
          createMessage(response.data, 'assistant', sessionId)
        )
      } else {
        console.log(`❌ Error: ${response.error?.message}`)
      }
    } catch (error: any) {
      console.log(`❌ Unexpected Error: ${error.message}`)
    }

    console.log('\n' + '-'.repeat(80))
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('\n\n✅ Conversation Continuity Test Complete!')
  console.log('   Check if Alex:')
  console.log('   ✓ Remembers previous messages')
  console.log('   ✓ References earlier topics')
  console.log('   ✓ Builds on the conversation naturally')
  console.log('   ✓ Shows progression in understanding')
  console.log('\n')
}

// Run all tests
async function runAllTests() {
  console.log('\n')
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗')
  console.log('║                   AI PERSONALITY ENHANCEMENT TEST SUITE                       ║')
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝')
  console.log('\n')

  try {
    await testAIPersonality()
    await testConversationContinuity()

    console.log('\n')
    console.log('╔═══════════════════════════════════════════════════════════════════════════════╗')
    console.log('║                            ALL TESTS COMPLETE                                 ║')
    console.log('╚═══════════════════════════════════════════════════════════════════════════════╝')
    console.log('\n')
  } catch (error: any) {
    console.error('\n❌ Test suite failed:', error.message)
    process.exit(1)
  }
}

// Run tests
runAllTests()
