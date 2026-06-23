import { prisma } from "@/lib/db"
import { ContributorDTO, FormDetailDTO } from "../types"
import { nonArchivedVersionsArgs } from "./versionSelectors"

function mapContributors(raw: unknown): ContributorDTO[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((c): c is Record<string, unknown> => typeof c === "object" && c !== null)
    .map((c) => ({
      name: typeof c.name === "string" ? c.name : "",
      role: typeof c.role === "string" ? c.role : "",
      orcid: typeof c.orcid === "string" ? c.orcid : null,
    }))
}

export async function getFormById(formId: number, userId: number): Promise<FormDetailDTO | null> {
  const form = await prisma.form.findFirst({
    where: {
      id: formId,
      userId,
      app: "marker",
      archived: false
    },
    include: {
      versions: {
        ...nonArchivedVersionsArgs,
        include: { publishedSchemas: true }
      }
    }
  })

  if (!form) return null

  return {
    id: form.id,
    versions: form.versions.map((v) => {
      const published = v.publishedSchemas[0] ?? null
      return {
        id: v.id,
        name: v.name,
        version: v.version,
        status: v.status,
        createdAt: v.createdAt,
        schema: (v.schema ?? {}) as Record<string, unknown>,
        uiSchema: (v.uiSchema ?? {}) as Record<string, unknown>,
        publishedSchema: published
          ? {
              pid: published.pid,
              version: published.version,
              license: published.license,
              domain: published.domain,
              language: published.language,
              releaseNotes: published.releaseNotes,
              keywords: published.keywords,
              contributors: mapContributors(published.contributors),
            }
          : null,
      }
    }),
  }
}
