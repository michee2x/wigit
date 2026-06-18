import { supabase } from '../lib/supabase'
import type { Session } from '@wigit/shared'

/**
 * Gets an existing session or creates a new one.
 * One session = one phone number per business.
 */
export async function getOrCreateSession(
  businessId: string,
  phoneNumber: string,
  customerRef: string | null
): Promise<Session> {
  // Try to find existing session
  const { data: existing, error: fetchError } = await supabase
    .from('sessions')
    .select('*')
    .eq('business_id', businessId)
    .eq('phone_number', phoneNumber)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    // PGRST116 = no rows found, which is expected
    console.error('[session] Error fetching session:', fetchError)
    throw fetchError
  }

  if (existing) {
    // Update customer_ref if a new one came in (e.g. room number from QR)
    if (customerRef && existing.customer_ref !== customerRef) {
      const { data: updated, error: updateError } = await supabase
        .from('sessions')
        .update({ customer_ref: customerRef })
        .eq('id', existing.id)
        .select('*')
        .single()

      if (updateError) {
        console.error('[session] Error updating session customer_ref:', updateError)
        return existing as Session
      }
      return updated as Session
    }
    return existing as Session
  }

  // Create a new session
  const { data: created, error: createError } = await supabase
    .from('sessions')
    .insert({
      business_id: businessId,
      phone_number: phoneNumber,
      customer_ref: customerRef,
    })
    .select('*')
    .single()

  if (createError || !created) {
    console.error('[session] Error creating session:', createError)
    throw createError ?? new Error('Failed to create session')
  }

  console.log(`[session] Created new session for ${phoneNumber} @ business ${businessId}`)
  return created as Session
}

/**
 * Saves a message to the logs table for a given session.
 */
export async function saveLog(
  sessionId: string,
  role: 'user' | 'assistant',
  message: string
): Promise<void> {
  const { error } = await supabase.from('logs').insert({
    session_id: sessionId,
    role,
    message,
  })

  if (error) {
    console.error('[session] Error saving log:', error)
    // Non-fatal — don't throw, just log
  }
}

/**
 * Fetches recent conversation history for a session (last 20 messages).
 */
export async function getConversationHistory(
  sessionId: string
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  const { data, error } = await supabase
    .from('logs')
    .select('role, message')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(20)

  if (error) {
    console.error('[session] Error fetching conversation history:', error)
    return []
  }

  return (data ?? []).map((row) => ({
    role: row.role as 'user' | 'assistant',
    content: row.message,
  }))
}
