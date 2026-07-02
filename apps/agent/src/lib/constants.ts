export const QR_PARAM_REGEX = /ROOM:([^|]+)\|KEY:([a-f0-9]+)/

export const BUSINESS_WEBHOOK_TIMEOUT_MS = 5000

export const GEMINI_MODEL = 'gemini-2.5-flash'

export const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0'

export const FALLBACK_WEBHOOK_ERROR_MESSAGE =
  "I'm having trouble fetching that information right now. Please call reception for an immediate answer."

export const REQUIRED_ENV_VARS = [
  'GEMINI_API_KEY',
  'WHATSAPP_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_VERIFY_TOKEN',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const
