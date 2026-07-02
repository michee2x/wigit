import { GoogleGenAI, Type, Schema } from '@google/genai'
import { GEMINI_MODEL } from '../lib/constants'
import type { AIIntentResponse } from '@wigit/shared'

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

function buildSystemInstruction(businessName: string, roomNumber: string): string {
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

Only help with things related to the guest's stay at ${businessName}.`
}

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    intent: {
      type: Type.STRING,
      enum: ['service_request', 'question', 'greeting', 'unclear'],
      description: 'The classified intent of the user message.',
    },
    items: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'List of requested items if intent is service_request. Leave empty otherwise.',
    },
    reply: {
      type: Type.STRING,
      nullable: true,
      description: 'Your reply to the user. For a question needing live data, leave this null.',
    },
    query: {
      type: Type.STRING,
      description: 'Brief query key if intent is question (e.g., checkout_time).',
    },
  },
  required: ['intent'],
}

/**
 * Calls Gemini with the full conversation history and returns a typed intent response.
 */
export async function callGemini(
  businessName: string,
  roomNumber: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  userMessage: string
): Promise<AIIntentResponse> {
  const contents = history.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }))

  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  })

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: buildSystemInstruction(businessName, roomNumber),
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    })

    const rawText = response.text
    if (!rawText) {
      throw new Error('No text content in Gemini response')
    }

    const parsed = JSON.parse(rawText) as AIIntentResponse
    console.log('[gemini] Intent detected:', parsed.intent)
    return parsed
  } catch (err) {
    console.error('[gemini] Error calling Gemini API:', err)
    // Return a safe fallback
    return {
      intent: 'unclear',
      reply: "I'm sorry, I'm having a bit of trouble understanding. Could you please rephrase your request? Or call reception for immediate assistance.",
    }
  }
}
