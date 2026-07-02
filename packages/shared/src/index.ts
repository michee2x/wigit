export type Business = {
  id: string
  name: string
  api_key: string
  webhook_url: string | null
  created_at: string
}

export type Session = {
  id: string
  business_id: string
  phone_number: string
  customer_ref: string | null
  started_at: string
}

export type ServiceRequest = {
  id: string
  session_id: string
  business_id: string
  room: string | null
  items: string[]
  raw_message: string
  status: 'pending' | 'done'
  created_at: string
}

export type Log = {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  message: string
  created_at: string
}

export type Intent =
  | 'service_request'
  | 'question'
  | 'greeting'
  | 'unclear'

export type AIIntentResponse = {
  intent: Intent
  items?: string[]
  reply?: string | null
  query?: string
}

export type BusinessWebhookRequest = {
  query_type: 'question'
  question: string
  customer_ref: string
  api_key: string
}

export type BusinessWebhookResponse = {
  answer: string
  status: 'success' | 'error'
}

export type WhatsAppTextMessage = {
  object: string
  entry: Array<{
    id: string
    changes: Array<{
      value: {
        messaging_product: string
        metadata: {
          display_phone_number: string
          phone_number_id: string
        }
        contacts?: Array<{
          profile: { name: string }
          wa_id: string
        }>
        messages?: Array<{
          from: string
          id: string
          timestamp: string
          text: { body: string }
          type: string
        }>
      }
      field: string
    }>
  }>
}
