"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { RequestCard } from "./RequestCard"
import type { ServiceRequest } from "@wigit/shared"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface StaffQueueProps {
  businessId: string
  initialRequests: ServiceRequest[]
}

export function StaffQueue({ businessId, initialRequests }: StaffQueueProps) {
  const [requests, setRequests] = useState<ServiceRequest[]>(initialRequests)

  useEffect(() => {
    // Subscribe to realtime changes
    const channel = supabase
      .channel('requests_queue')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'requests',
        filter: `business_id=eq.${businessId}`
      }, (payload) => {
        setRequests(prev => [payload.new as ServiceRequest, ...prev])
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'requests',
        filter: `business_id=eq.${businessId}`
      }, (payload) => {
        const updated = payload.new as ServiceRequest
        setRequests(prev => prev.map(r => r.id === updated.id ? updated : r))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [businessId])

  // Split into pending and done
  const pending = requests.filter(r => r.status === 'pending')
  const done = requests.filter(r => r.status === 'done')

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center justify-between">
          <span>Pending</span>
          <span className="bg-amber-100 text-amber-800 text-xs py-1 px-2 rounded-full dark:bg-amber-900/30 dark:text-amber-500">
            {pending.length}
          </span>
        </h2>
        <div className="space-y-4">
          {pending.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No pending requests. Great job!
            </div>
          ) : (
            pending.map(req => <RequestCard key={req.id} request={req} />)
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-muted-foreground flex items-center justify-between">
          <span>Recently Completed</span>
          <span className="bg-emerald-100 text-emerald-800 text-xs py-1 px-2 rounded-full dark:bg-emerald-900/30 dark:text-emerald-500">
            {done.length}
          </span>
        </h2>
        <div className="space-y-4 opacity-75">
          {done.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No completed requests yet.
            </div>
          ) : (
            done.slice(0, 10).map(req => <RequestCard key={req.id} request={req} />)
          )}
        </div>
      </div>
    </div>
  )
}
