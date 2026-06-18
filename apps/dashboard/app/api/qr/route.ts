import { NextResponse } from "next/server"
import QRCode from "qrcode"
import { auth } from "@/auth"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { room } = await req.json()
    if (!room) {
      return new NextResponse("Room is required", { status: 400 })
    }

    // Get the business API key
    const { data: business } = await supabaseServer
      .from('businesses')
      .select('api_key')
      .eq('id', session.user.id)
      .single()

    if (!business) {
      return new NextResponse("Business not found", { status: 404 })
    }

    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "2340000000000" // Replace with actual number
    const text = encodeURIComponent(`ROOM:${room}|KEY:${business.api_key}`)
    const waLink = `https://wa.me/${whatsappNumber}?text=${text}`

    // Generate QR code data URI
    const qrDataUrl = await QRCode.toDataURL(waLink, {
      width: 400,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff"
      }
    })

    return NextResponse.json({ qrCodeUrl: qrDataUrl, link: waLink })
  } catch (error) {
    console.error("QR Generation error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
