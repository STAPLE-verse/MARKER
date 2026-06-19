"use server";

import { prisma } from "@/lib/db";
import { authenticatedAction } from "@/utils/safe-action";
import { publishSchemaActionSchema } from "../schemas";
import { revalidatePath } from "next/cache";
import { generatePID } from "@/utils/id";

export const publishSchema = authenticatedAction(
  publishSchemaActionSchema,
  async ({ input, userId }) => {
    // 1. Fetch the form and its latest version to ensure ownership and get the raw JSON
    const form = await prisma.form.findFirst({
      where: { 
        id: input.formId,
        userId: userId,
        archived: false
      },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1
        }
      }
    });

    if (!form || form.versions.length === 0) {
      throw new Error("Form not found or has no versions.");
    }

    const latestVersion = form.versions[0];
    
    const pid = generatePID("ps");
    const semVer = `1.0.${latestVersion.version}`;
    const familyId = `family_${form.id}`;

    // 2. Create the immutable PublishedSchema snapshot
    const publishedSchema = await prisma.publishedSchema.create({
      data: {
        pid,
        title: latestVersion.name || "Untitled Schema",
        description: "",
        schemaJson: latestVersion.schema ?? {},
        uiSchema: latestVersion.uiSchema ?? {},
        source: "native",
        version: semVer,
        familyId,
        license: input.license,
        releaseNotes: input.releaseNotes,
        domain: input.domain,
        language: input.language,
        authorId: userId,
        contributors: input.contributors.map(c => ({
          name: c.name,
          role: c.role,
          orcid: c.orcid || null
        })),
        originFormVersionId: latestVersion.id
      }
    });

    revalidatePath(`/collection/${input.formId}`);
    
    return { success: true, pid: publishedSchema.pid };
  }
);
