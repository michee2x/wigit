import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { Sidebar } from "@/components/Sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
    return null
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar userEmail={session.user.email ?? ""} />

      {/* Main content */}
      <main className="flex-1 bg-background">
        {children}
      </main>
    </div>
  )
}

