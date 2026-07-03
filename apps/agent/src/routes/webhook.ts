import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { QR_PARAM_REGEX } from '../lib/constants'
import { getOrCreateSession, saveLog, getConversationHistory } from '../services/session'
import { sendWhatsAppMessage } from '../services/whatsapp'
import { callGemini } from '../services/gemini'
import { handleServiceRequest } from '../services/intent'
import { callBusinessWebhook } from '../services/businessWebhook'

// ─── Zod schema for Meta WhatsApp webhook payload ─────────────────────────────
const WhatsAppWebhookSchema = z.object({
  object: z.string(),
  entry: z.array(z.object({
    id: z.string(),
    changes: z.array(z.object({
      value: z.object({
        messaging_product: z.string(),
        metadata: z.object({
          display_phone_number: z.string(),
          phone_number_id: z.string(),
        }),
        contacts: z.array(z.object({
          profile: z.object({ name: z.string() }),
          wa_id: z.string(),
        })).optional(),
        messages: z.array(z.object({
          from: z.string(),
          id: z.string(),
          timestamp: z.string(),
          text: z.object({ body: z.string() }),
          type: z.string(),
        })).optional(),
      }),
      field: z.string(),
    })),
  })),
})

type ValidatedWhatsAppPayload = z.infer<typeof WhatsAppWebhookSchema>

export const webhookRouter = Router()

// ─── GET /webhook — Meta webhook verification ─────────────────────────────────
webhookRouter.get('/', (req: Request, res: Response) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('[webhook] Meta webhook verified ✓')
    res.status(200).send(challenge)
  } else {
    console.warn('[webhook] Meta verification failed — token mismatch')
    res.sendStatus(403)
  }
})

// ─── POST /webhook — Receive incoming WhatsApp messages ───────────────────────
webhookRouter.post('/', (req: Request, res: Response) => {
  // Respond to Meta IMMEDIATELY — must be under 200ms
  res.sendStatus(200)

  console.log('[webhook] 🛑 RAW POST REQUEST RECEIVED 🛑')
  console.log('[webhook] Headers:', JSON.stringify(req.headers))
  console.log('[webhook] Body:', JSON.stringify(req.body, null, 2))

  // Validate payload with Zod, then process asynchronously
  const parsed = WhatsAppWebhookSchema.safeParse(req.body)
  if (!parsed.success) {
    console.warn('[webhook] Invalid payload shape:', JSON.stringify(parsed.error.issues, null, 2))
    return
  }

  processIncomingMessage(parsed.data).catch((err) => {
    console.error('[webhook] Unhandled error in message processing:', err)
  })
})

// ─── Core async processing logic ──────────────────────────────────────────────
async function processIncomingMessage(body: ValidatedWhatsAppPayload): Promise<void> {
  try {
    // 1. Extract message data from Meta payload
    const entry = body?.entry?.[0]
    const change = entry?.changes?.[0]
    const message = change?.value?.messages?.[0]

    if (!message || message.type !== 'text') {
      console.log('[webhook] Ignoring non-text message or status update')
      return
    }

    const phoneNumber = message.from
    const messageText = message.text.body
    console.log(`[webhook] Message from ${phoneNumber}: "${messageText}"`)

    // 2. Parse room number and API key from the message (QR format: ROOM:12|KEY:abc123)
    let roomNumber = 'Unknown'
    let apiKey: string | null = null
    const qrMatch = QR_PARAM_REGEX.exec(messageText)
    if (qrMatch) {
      roomNumber = qrMatch[1]
      apiKey = qrMatch[2]
    }

    // 3. Look up business by API key
    let businessId: string
    let businessName: string
    let webhookUrl: string | null = null

    if (apiKey) {
      const { data: business, error } = await supabase
        .from('businesses')
        .select('id, name, webhook_url')
        .eq('api_key', apiKey)
        .single()

      if (error || !business) {
        console.error('[webhook] Business not found for API key:', apiKey)
        return
      }
      businessId = business.id
      businessName = business.name
      webhookUrl = business.webhook_url
    } else {
      // Fallback: try to find existing session by phone number
      // (subsequent messages after the QR scan won't include the key again)
      const { data: session } = await supabase
        .from('sessions')
        .select('business_id, customer_ref, businesses(id, name, webhook_url)')
        .eq('phone_number', phoneNumber)
        .order('started_at', { ascending: false })
        .limit(1)
        .single()

      if (!session) {
        console.warn('[webhook] No session found for', phoneNumber, '— guest must scan QR first')
        await sendWhatsAppMessage(
          phoneNumber,
          "Hi! To get started, please scan the QR code in your room. I'll be happy to help you from there! 😊"
        )
        return
      }

      const biz = session.businesses as unknown as { id: string; name: string; webhook_url: string | null }
      businessId = biz.id
      businessName = biz.name
      webhookUrl = biz.webhook_url
      roomNumber = session.customer_ref ?? 'Unknown'
    }

    // 4. Get or create session
    const session = await getOrCreateSession(businessId, phoneNumber, roomNumber)

    // 5. Save user message to logs
    await saveLog(session.id, 'user', messageText)

    // 6. Fetch conversation history for context
    const history = await getConversationHistory(session.id)

    // 7. Call Gemini for intent detection
    const intentResponse = await callGemini(businessName, roomNumber, history, messageText)

    let replyText: string

    if (intentResponse.intent === 'service_request') {
      // 8a. Save service request to Supabase (Realtime fires to staff dashboard)
      await handleServiceRequest(intentResponse, session.id, businessId, roomNumber, messageText)
      replyText = intentResponse.reply ?? "Got it! Your request has been logged and a member of staff will attend to you shortly. 🛎️"

    } else if (intentResponse.intent === 'question' && webhookUrl) {
      // 8b. Fetch live data from business webhook
      const answer = await callBusinessWebhook(webhookUrl, {
        query_type: 'question',
        question: intentResponse.query ?? messageText,
        customer_ref: `Room ${roomNumber}`,
        api_key: apiKey ?? '',
      })

      // Feed the answer back to Gemini to format a nice reply
      const followUp = await callGemini(
        businessName,
        roomNumber,
        [...history, { role: 'user', content: messageText }],
        `The answer to the guest's question is: "${answer}". Please relay this information to them naturally.`
      )
      replyText = followUp.reply ?? answer

    } else {
      // 8c. Greeting, unclear, or question without a webhook configured
      replyText = intentResponse.reply ?? "I'm here to help! Could you please tell me what you need? 😊"
    }

    // 9. Send WhatsApp reply
    await sendWhatsAppMessage(phoneNumber, replyText)

    // 10. Save assistant reply to logs
    await saveLog(session.id, 'assistant', replyText)

  } catch (err) {
    console.error('[webhook] Error processing message:', err)
  }
}
