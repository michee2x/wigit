import axios from 'axios'
import type { BusinessWebhookRequest, BusinessWebhookResponse } from '@wigit/shared'
import { BUSINESS_WEBHOOK_TIMEOUT_MS, FALLBACK_WEBHOOK_ERROR_MESSAGE } from '../lib/constants'

/**
 * Calls the business's registered webhook URL to fetch live data.
 * Returns the answer string, or a fallback message on failure/timeout.
 */
export async function callBusinessWebhook(
  webhookUrl: string,
  payload: BusinessWebhookRequest
): Promise<string> {
  try {
    const response = await axios.post<BusinessWebhookResponse>(webhookUrl, payload, {
      timeout: BUSINESS_WEBHOOK_TIMEOUT_MS,
      headers: { 'Content-Type': 'application/json' },
    })

    if (response.data.status === 'success' && response.data.answer) {
      return response.data.answer
    }

    console.warn('[businessWebhook] Webhook returned non-success status:', response.data)
    return FALLBACK_WEBHOOK_ERROR_MESSAGE
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (err.code === 'ECONNABORTED') {
        console.error('[businessWebhook] Webhook timed out after', BUSINESS_WEBHOOK_TIMEOUT_MS, 'ms')
      } else {
        console.error('[businessWebhook] Webhook request failed:', err.response?.data ?? err.message)
      }
    } else {
      console.error('[businessWebhook] Unknown error calling webhook:', err)
    }
    return FALLBACK_WEBHOOK_ERROR_MESSAGE
  }
}
