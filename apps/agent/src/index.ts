import express from 'express'
import { webhookRouter } from './routes/webhook'
import { REQUIRED_ENV_VARS } from './lib/constants'

// ─── Startup environment check ────────────────────────────────────────────────
for (const envVar of REQUIRED_ENV_VARS) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}

const app = express()
const PORT = process.env.PORT ?? 3001

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/webhook', webhookRouter)

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT as number, '0.0.0.0', () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   Wigit AI Agent — Running           ║
  ║   Port: ${PORT}                          ║
  ║   Webhook: http://0.0.0.0:${PORT}/webhook    ║
  ╚══════════════════════════════════════╝
  `)
})

export default app
