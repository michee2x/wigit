"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface SettingsFormProps {
  business: {
    id: string
    name: string
    api_key: string
    webhook_url: string | null
  }
}

export function SettingsForm({ business }: SettingsFormProps) {
  const [webhookUrl, setWebhookUrl] = useState(business.webhook_url || "")
  const [loading, setLoading] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const { toast } = useToast()

  const saveWebhook = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ webhook_url: webhookUrl })
        .eq('id', business.id)

      if (error) throw error

      toast({
        title: "Settings saved",
        description: "Your webhook URL has been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const copyApiKey = () => {
    navigator.clipboard.writeText(business.api_key)
    toast({
      title: "Copied!",
      description: "API key copied to clipboard.",
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>Basic details about your business account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Business Name</Label>
            <Input disabled value={business.name} />
          </div>
          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="flex gap-2">
              <Input 
                disabled 
                type={showKey ? "text" : "password"} 
                value={business.api_key} 
                className="font-mono text-sm"
              />
              <Button variant="outline" onClick={() => setShowKey(!showKey)}>
                {showKey ? "Hide" : "Show"}
              </Button>
              <Button variant="secondary" onClick={copyApiKey}>
                Copy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Keep this key secret. It is used to authenticate your webhook requests and generated QR codes.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Configuration</CardTitle>
          <CardDescription>
            The URL where Wigit will send POST requests when the AI needs live data to answer a guest's question.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhookUrl">Webhook URL</Label>
            <Input 
              id="webhookUrl"
              placeholder="https://your-hotel-api.com/wigit-webhook"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={saveWebhook} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
