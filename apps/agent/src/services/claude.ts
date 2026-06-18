import Anthropic from '@anthropic-ai/sdk'
import { CLAUDE_MODEL } from '../lib/constants'
import type { ClaudeIntentResponse } from '@wigit/shared'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

function buildSystemPrompt(businessName: string, roomNumber: string): string {
  const currentTime = new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })
  return `You are an AI assistant for ${businessName}, a Nigerian hotel.

Your job:
1. Greet guests warmly and help them with their requests
2. If a guest asks a question that needs live data (e.g. checkout time, room rates, availability), tell them you are checking and classify it as a question intent
3. If a guest makes a service request (food, drinks, towels, cleaning, maintenance, etc.), confirm what they want, then log it as a service request
4. Always be warm, concise, and professional
5. You understand Nigerian Pidgin English — respond naturally if the guest uses it
6. Never make up information you do not have. If you cannot help, say so politely and suggest they call reception

Current guest: Room ${roomNumber}
Current time: ${currentTime} (WAT)

IMPORTANT: Always respond with a valid JSON object in this exact format:

For service requests:
{
  "intent": "service_request",
  "items": ["Item 1", "Item 2"],
  "reply": "Your friendly reply to the guest confirming their request"
}

For questions needing live data:
{
  "intent": "question",
  "query": "brief_query_key",
  "question": "The exact question the guest is asking",
  "reply": null
}

For questions you can answer directly (greetings, general info):
{
  "intent": "greeting",
  "reply": "Your warm reply"
}

For unclear messages:
{
  "intent": "unclear",
  "reply": "Polite clarification request"
}

Only respond in the JSON format above. Do not add any text outside the JSON.
Only help with things related to the guest's stay at ${businessName}.`
}

/**
 * Calls Claude with the full conversation history and returns a typed intent response.
 */
export async function callClaude(
  businessName: string,
  roomNumber: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  userMessage: string
): Promise<ClaudeIntentResponse> {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...history,
    { role: 'user', content: userMessage },
  ]

  try {
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: buildSystemPrompt(businessName, roomNumber),
      messages,
    })

    const textContent = response.content.find((block) => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response')
    }

    // Strip markdown code fences if present
    let rawText = textContent.text.trim()
    if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    }

    const parsed = JSON.parse(rawText) as ClaudeIntentResponse
    console.log('[claude] Intent detected:', parsed.intent)
    return parsed
  } catch (err) {
    console.error('[claude] Error calling Claude API:', err)
    // Return a safe fallback
    return {
      intent: 'unclear',
      reply: "I'm sorry, I'm having a bit of trouble understanding. Could you please rephrase your request? Or call reception for immediate assistance.",
    }
  }
}
