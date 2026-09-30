"use server"

import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

const breadcrumbLabelSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("form"), id: z.string().regex(/^\d+$/) }),
  z.object({ type: z.literal("schema"), id: z.string().min(1).max(200) }),
])

export type BreadcrumbLabelInput = z.infer<typeof breadcrumbLabelSchema>

/**
 * Resolves the display name behind a record segment of the URL for the navbar
 * breadcrumbs (`/collection/[id]` → the form's name, `/schemas/[pid]` → the
 * published schema's title). MARKER's counterpart to STAPLE's
 * `getBreadcrumbLabel`.
 *
 * Not an `authenticatedAction`: schema crumbs are shown on public pages to
 * signed-out visitors. Returns `null` — never throws, never an error envelope
 * — for anything the viewer can't see or that doesn't exist, and the crumb
 * falls back to a generic label.
 *
 * Form names are scoped exactly like `getFormById`: the owner always, a
 * collaborator (pending or accepted) only while the form is active.
 */
export async function getBreadcrumbLabel(input: BreadcrumbLabelInput): Promise<string | null> {
  try {
    const parsed = breadcrumbLabelSchema.safeParse(input)
    if (!parsed.success) return null

    if (parsed.data.type === "schema") {
      const schema = await prisma.publishedSchema.findUnique({
        where: { pid: parsed.data.id },
        select: { title: true },
      })
      return schema?.title ?? null
    }

    const session = await auth()
    if (!session?.user) return null
    const userId = Number(session.user.id)

    const form = await prisma.markerForm.findFirst({
      where: {
        id: Number(parsed.data.id),
        OR: [
          { ownerId: userId },
          { archived: false, collaborators: { some: { userId } } },
        ],
      },
      select: { id: true, archived: true },
    })
    if (!form) return null

    const latestVersion = await prisma.markerFormVersion.findFirst({
      where: { formId: form.id, ...(form.archived ? {} : { archived: false }) },
      orderBy: { version: "desc" },
      select: { name: true },
    })
    return latestVersion?.name ?? null
  } catch (e) {
    console.error("getBreadcrumbLabel failed:", e)
    return null
  }
}
