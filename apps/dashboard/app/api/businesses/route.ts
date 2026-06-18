import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import bcrypt from "bcryptjs"
import crypto from "crypto"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: existingBusiness } = await supabaseServer
      .from('businesses')
      .select('id')
      .eq('email', email)
      .single()

    if (existingBusiness) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const apiKey = crypto.randomBytes(32).toString('hex')

    const { data, error } = await supabaseServer
      .from('businesses')
      .insert([
        {
          name,
          email,
          password_hash: passwordHash,
          api_key: apiKey
        }
      ])
      .select('id, name, email, api_key')
      .single()

    if (error) {
      console.error("Supabase insert error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    return NextResponse.json({ business: data }, { status: 201 })
  } catch (error) {
    console.error("Create business error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
