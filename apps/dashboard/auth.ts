import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { supabaseServer } from "@/lib/supabase-server"
import bcrypt from "bcryptjs"
import { z } from "zod"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          const parsedCredentials = z
            .object({ email: z.string().email(), password: z.string().min(6) })
            .safeParse(credentials)

          if (parsedCredentials.success) {
            const { email, password } = parsedCredentials.data

            const { data: business, error } = await supabaseServer
              .from('businesses')
              .select('*')
              .eq('email', email)
              .single()

            if (error || !business) {
              console.error("Auth error:", error)
              return null
            }

            const passwordsMatch = await bcrypt.compare(password, business.password_hash)

            if (passwordsMatch) {
              return {
                id: business.id,
                name: business.name,
                email: business.email,
              }
            }
          }
          return null
        } catch (error) {
          console.error("Error in authorize:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    }
  },
  pages: {
    signIn: '/login',
  },
})
