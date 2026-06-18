import axios from 'axios'
import { WHATSAPP_API_URL } from '../lib/constants'

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const TOKEN = process.env.WHATSAPP_TOKEN

/**
 * Sends a text message to a WhatsApp number via the Meta Cloud API.
 */
export async function sendWhatsAppMessage(
  to: string,
  message: string
): Promise<void> {
  if (!PHONE_NUMBER_ID || !TOKEN) {
    throw new Error('Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_TOKEN')
  }

  try {
    await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    )
    console.log(`[whatsapp] Sent message to ${to}`)
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error('[whatsapp] Failed to send message:', err.response?.data ?? err.message)
    } else {
      console.error('[whatsapp] Unknown error sending message:', err)
    }
    throw err
  }
}
