import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { QRGenerator } from "@/components/QRGenerator"

export default async function QRCodesPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
    return null
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">QR Codes</h1>
        <p className="text-muted-foreground">
          Generate custom WhatsApp QR codes for each of your rooms.
        </p>
      </div>
      
      <div className="flex justify-center md:justify-start">
        <QRGenerator />
      </div>
    </div>
  )
}
