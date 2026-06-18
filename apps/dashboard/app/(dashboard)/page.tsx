import { auth } from "@/auth"
import { supabaseServer } from "@/lib/supabase-server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, CheckCircle, Clock } from "lucide-react"

export default async function DashboardPage() {
  const session = await auth()
  
  // Fetch stats from Supabase
  const { count: pendingCount } = await supabaseServer
    .from('requests')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', session?.user?.id)
    .eq('status', 'pending')

  const { count: doneCount } = await supabaseServer
    .from('requests')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', session?.user?.id)
    .eq('status', 'done')

  const { count: totalLogs } = await supabaseServer
    .from('logs')
    .select('id', { count: 'exact', head: true })

  // Need to join logs with sessions to filter by business, but for simplicity we show total session count
  const { count: sessionCount } = await supabaseServer
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', session?.user?.id)

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">
          Monitor your AI assistant's performance and guest requests.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Completed Requests</CardTitle>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{doneCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Fulfilled by staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Chat Sessions</CardTitle>
            <Activity className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Guests assisted by AI</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
