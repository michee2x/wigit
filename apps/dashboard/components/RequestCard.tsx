"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import type { ServiceRequest } from "@wigit/shared"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface RequestCardProps {
  request: ServiceRequest
}

export function RequestCard({ request }: RequestCardProps) {
  const isDone = request.status === "done"

  const markAsDone = async () => {
    await supabase
      .from('requests')
      .update({ status: 'done' })
      .eq('id', request.id)
  }

  return (
    <Card className={isDone ? "opacity-60 bg-muted/50" : "border-l-4 border-l-amber-500"}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Room {request.room}</CardTitle>
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="mr-1 h-3 w-3" />
            {new Date(request.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Requested Items:</h4>
            <ul className="list-inside list-disc text-sm">
              {request.items?.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-md bg-muted p-3 text-sm italic text-muted-foreground">
            "{request.raw_message}"
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          variant={isDone ? "outline" : "default"}
          disabled={isDone}
          onClick={markAsDone}
        >
          {isDone ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
              Completed
            </>
          ) : (
            "Mark as Done"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
