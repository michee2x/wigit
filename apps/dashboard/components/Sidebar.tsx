"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { LayoutDashboard, Users, QrCode, Settings, ScrollText, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Staff Queue", href: "/staff", icon: Users },
  { name: "QR Codes", href: "/qr-codes", icon: QrCode },
  { name: "Chat Logs", href: "/logs", icon: ScrollText },
  { name: "Settings", href: "/settings", icon: Settings },
]

interface SidebarProps {
  userEmail: string
}

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r bg-muted/40">
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center border-b px-6">
          <span className="font-bold text-lg tracking-tight">Wigit</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive && "bg-accent text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className="border-t p-4">
          <div className="mb-4 px-3 text-sm font-medium text-muted-foreground truncate">
            {userEmail}
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}
