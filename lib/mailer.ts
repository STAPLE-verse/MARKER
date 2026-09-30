import { Resend } from "resend"

/** The shape every template in `lib/emails.ts` returns — what Resend's `emails.send` takes. */
export type EmailMessage = {
  from: string
  to: string | string[]
  subject: string
  replyTo?: string
  html: string
}

export type SendEmailResult = { success: true } | { success: false; error: unknown }

// Created on first use rather than at import: `new Resend()` throws without a
// key, and a missing key should mean "no email", not a server that won't boot.
let client: Resend | null = null

/**
 * Sends one email through Resend — the same provider and account STAPLE uses
 * (`ResendMsg` in STAPLE's `integrations/mailer.js`), so both apps send from
 * the same verified domain.
 *
 * Never throws. Email is always a side effect of something that has already
 * succeeded (a saved password, a created invite), so a delivery problem is
 * logged and reported in the result instead of failing the caller's action.
 * With no `RESEND_API_KEY` set (local development, tests) nothing is sent.
 */
export async function sendEmail(msg: EmailMessage): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn(`RESEND_API_KEY is not set — skipped email "${msg.subject}"`)
    return { success: false, error: "RESEND_API_KEY is not set" }
  }

  try {
    client ??= new Resend(apiKey)
    const response = await client.emails.send(msg)
    if (response.error) {
      console.error(`Failed to send email "${msg.subject}":`, response.error)
      return { success: false, error: response.error }
    }
    return { success: true }
  } catch (error) {
    console.error(`Failed to send email "${msg.subject}":`, error)
    return { success: false, error }
  }
}
