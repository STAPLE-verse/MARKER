import type { EmailMessage } from "./mailer"

/**
 * MARKER's email templates, mirroring STAPLE's `integrations/emails.tsx`: one
 * `create…Msg` function per email, each returning a complete message for
 * `sendEmail` (`lib/mailer.ts`). Sent from STAPLE's verified domain, with
 * replies going to the same help desk.
 */
const FROM = process.env.EMAIL_FROM || "MARKER <app@staplescience.com>"
const REPLY_TO = "STAPLE Help <staple.helpdesk@gmail.com>"
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "")

/** Usernames and schema titles are user-written, so they're escaped before going into HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/** The shared frame: heading, body, help-desk sign-off, and footer. */
function layout(heading: string, body: string): string {
  return `
    <html>
    <body>
      <h3>${heading}</h3>

      ${body}
      <p>
      If you need more help, you can reply to this email to create a ticket.
      <p>
      Thanks,
      <br>
      STAPLE Help Desk

      <hr style="border:none;border-bottom:1px solid #BFC3C8;margin:12px 0">

      <p style="margin:6pt 0;text-align:center">
      MARKER: Metadata archive for research knowledge exchange and reuse
      <p style="margin:6pt 0;text-align:center">
      ${APP_URL}
      <p style="margin:6pt 0;text-align:center">
      staple.helpdesk@gmail.com
    </body>
    </html>
  `
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  EDITOR: "an editor, who can change the schema",
  VIEWER: "a viewer, who can see the schema but not change it",
}

export function createCollaboratorInviteMsg({
  to,
  inviterUsername,
  formId,
  formTitle,
  role,
}: {
  to: string
  inviterUsername: string
  formId: number
  formTitle: string
  role: string
}): EmailMessage {
  const roleDescription = ROLE_DESCRIPTIONS[role] ?? "a collaborator"

  return {
    from: FROM,
    to,
    subject: "MARKER Schema Invitation",
    replyTo: REPLY_TO,
    html: layout(
      "MARKER Schema Invitation",
      `
      ${escapeHtml(inviterUsername)} invited you to collaborate on the schema
      "${escapeHtml(formTitle)}" in MARKER as ${roleDescription}.
      <p>
      To respond, <a href="${APP_URL}/collection/${formId}">open the schema in MARKER</a>
      and log in. You can accept or decline the invitation from there.
      `
    ),
  }
}

export function createEditPasswordMsg({ to }: { to: string }): EmailMessage {
  return {
    from: FROM,
    to,
    subject: "MARKER Password Change",
    replyTo: REPLY_TO,
    html: layout(
      "MARKER Password Change",
      `
      This email is to notify you that you recently updated your password at
      ${APP_URL}. MARKER and STAPLE share one account, so the new password
      applies to both. If you did not make this change, please contact us
      immediately.
      `
    ),
  }
}

export function createEditProfileMsg({ to }: { to: string | string[] }): EmailMessage {
  return {
    from: FROM,
    to,
    subject: "MARKER Profile Change",
    replyTo: REPLY_TO,
    html: layout(
      "MARKER Profile Change",
      `
      This email is to notify you that you recently updated your profile
      information at ${APP_URL}. MARKER and STAPLE share one account, so the
      change applies to both. If you did not make this change, please contact
      us immediately.
      `
    ),
  }
}
