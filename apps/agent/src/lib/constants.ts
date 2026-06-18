export const QR_PARAM_REGEX = /ROOM:([^|]+)\|KEY:([a-f0-9]+)/

export const BUSINESS_WEBHOOK_TIMEOUT_MS = 5000

export const CLAUDE_MODEL = 'claude-sonnet-4-5'

export const WHATSAPP_API_URL = 'https://graph.facebook.com/v19.0'

export const FALLBACK_WEBHOOK_ERROR_MESSAGE =
  "I'm having trouble fetching that information right now. Please call reception for an immediate answer."

export const REQUIRED_ENV_VARS = [
  'ANTHROPIC_API_KEY',
  'WHATSAPP_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_VERIFY_TOKEN',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const
