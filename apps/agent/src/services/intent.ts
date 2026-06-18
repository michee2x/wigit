import type { ClaudeIntentResponse } from '@wigit/shared'
import { supabase } from '../lib/supabase'

/**
 * Handles a service_request intent — saves to Supabase requests table.
 * Supabase Realtime will push the new row to the staff dashboard instantly.
 */
export async function handleServiceRequest(
  intentResponse: ClaudeIntentResponse,
  sessionId: string,
  businessId: string,
  room: string,
  rawMessage: string
): Promise<void> {
  const items = intentResponse.items ?? []

  const { error } = await supabase.from('requests').insert({
    session_id: sessionId,
    business_id: businessId,
    room,
    items,
    raw_message: rawMessage,
    status: 'pending',
  })

  if (error) {
    console.error('[intent] Error saving service request to Supabase:', error)
    throw error
  }

  console.log(`[intent] Service request saved — Room ${room}:`, items)
}
