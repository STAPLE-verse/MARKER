"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { authenticatedAction } from "@/utils/safe-action";
import { publishSchemaActionSchema } from "../schemas";
import { revalidatePath } from "next/cache";
import { generatePID } from "@/utils/id";
import { extractOntologyIds, extractSchemaDescription } from "@/utils/schema";

// How many times to regenerate a PID if we hit an (astronomically unlikely) collision.
const MAX_PID_ATTEMPTS = 5;

export const publishSchema = authenticatedAction(
  publishSchemaActionSchema,
  async ({ input, userId }) => {
    // 1. Fetch the form and its latest non-archived version to ensure ownership
    //    and get the raw JSON. The `archived: false` filter mirrors getFormById so
    //    "latest version" means the same thing everywhere.
    const form = await prisma.form.findFirst({
      where: {
        id: input.formId,
        userId: userId,
        app: "marker",
        archived: false
      },
      include: {
        versions: {
          where: { archived: false },
          orderBy: { version: 'desc' },
          take: 1
        }
      }
    });

    if (!form || form.versions.length === 0) {
      throw new Error("Form not found or has no versions.");
    }

    const latestVersion = form.versions[0];

    if (latestVersion.status === "PUBLISHED") {
      throw new Error("This version is already published.");
    }

    const familyId = `family_${form.id}`;

    // 2. Create the immutable PublishedSchema snapshot and lock the FormVersion.
    //    PIDs come from a collision-resistant generator, but we still retry on the
    //    off chance of a primary-key collision. A familyId+version clash is a real
    //    user error (re-publishing an existing version) and is surfaced as such.
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_PID_ATTEMPTS; attempt++) {
      const pid = generatePID("ps");
      try {
        const [publishedSchema] = await prisma.$transaction([
          prisma.publishedSchema.create({
            data: {
              pid,
              title: latestVersion.name || "Untitled Schema",
              description: extractSchemaDescription(latestVersion.schema),
              schemaJson: latestVersion.schema ?? {},
              uiSchema: latestVersion.uiSchema ?? {},
              source: "native",
              version: input.version,
              familyId,
              license: input.license,
              releaseNotes: input.releaseNotes,
              relatedPublicationDoi: input.relatedPublicationDoi,
              keywords: input.keywords,
              domain: input.domain,
              language: input.language,
              ontologyRefs: extractOntologyIds(latestVersion.schema),
              authorId: userId,
              contributors: input.contributors.map(c => ({
                name: c.name,
                role: c.role,
                orcid: c.orcid || null
              })),
              originFormVersionId: latestVersion.id
            }
          }),
          prisma.formVersion.update({
            where: { id: latestVersion.id },
            data: { status: "PUBLISHED" }
          })
        ]);

        revalidatePath(`/collection/${input.formId}`);
        return { success: true, pid: publishedSchema.pid };
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          const target = JSON.stringify(error.meta?.target ?? "");
          if (target.includes("familyId") || target.includes("version")) {
            throw new Error(
              `Version ${input.version} has already been published for this schema. Please choose a higher version number.`
            );
          }
          // Otherwise treat it as a PID collision and try again with a fresh PID.
          lastError = error;
          continue;
        }
        throw error;
      }
    }

    throw new Error("Failed to generate a unique PID for the schema. Please try again.", { cause: lastError });
  }
);
