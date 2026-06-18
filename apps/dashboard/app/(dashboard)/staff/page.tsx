import { auth } from "@/auth"
import { supabaseServer } from "@/lib/supabase-server"
import { StaffQueue } from "@/components/StaffQueue"
import { redirect } from "next/navigation"

export default async function StaffPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
    return null
  }

  // Fetch initial requests for server-side rendering
  const { data: initialRequests } = await supabaseServer
    .from('requests')
    .select('*')
    .eq('business_id', session.user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Staff Queue</h1>
        <p className="text-muted-foreground">
          Real-time feed of guest service requests requiring human attention.
        </p>
      </div>
      
      <StaffQueue 
        businessId={session.user.id} 
        initialRequests={initialRequests || []} 
      />
    </div>
  )
}
