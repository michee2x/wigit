import { auth } from "@/auth"
import { supabaseServer } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { SettingsForm } from "@/components/SettingsForm"

export default async function SettingsPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
    return null
  }

  const { data: business } = await supabaseServer
    .from('businesses')
    .select('id, name, api_key, webhook_url')
    .eq('id', session.user.id)
    .single()

  if (!business) {
    return <div>Error loading business profile</div>
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your business API key and webhook configuration.
        </p>
      </div>
      
      <SettingsForm business={business} />
    </div>
  )
}
