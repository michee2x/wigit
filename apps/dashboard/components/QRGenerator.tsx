"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import Image from "next/image"

export function QRGenerator() {
  const [roomNumber, setRoomNumber] = useState("")
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const generateQR = async () => {
    if (!roomNumber) {
      setError("Please enter a room number")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: roomNumber })
      })

      if (!res.ok) {
        throw new Error("Failed to generate QR code")
      }

      const data = await res.json()
      setQrCode(data.qrCodeUrl)
    } catch (err) {
      setError("An error occurred while generating the QR code.")
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (qrCode) {
      const link = document.createElement("a")
      link.href = qrCode
      link.download = `room-${roomNumber}-qr.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Generate Room QR Code</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <div className="text-sm text-destructive">{error}</div>}
        <div className="space-y-2">
          <Label htmlFor="roomNumber">Room Number or Identifier</Label>
          <div className="flex gap-2">
            <Input
              id="roomNumber"
              placeholder="e.g. 101"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
            />
            <Button onClick={generateQR} disabled={loading}>
              {loading ? "Generating..." : "Generate"}
            </Button>
          </div>
        </div>

        {qrCode && (
          <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-white">
            <Image 
              src={qrCode} 
              alt={`QR Code for Room ${roomNumber}`} 
              width={250} 
              height={250} 
              className="mb-4"
            />
            <Button onClick={handleDownload} variant="outline" className="w-full text-black">
              Download PNG
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
