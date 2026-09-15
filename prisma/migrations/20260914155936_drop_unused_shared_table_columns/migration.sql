-- Drops MARKER-introduced additions to STAPLE-owned tables (`Form`,
-- `FormVersion`) confirmed unused anywhere in MARKER's own code (no
-- prisma.form.*/prisma.formVersion.* call, no raw SQL, no relation include
-- selects any of them, and `formId_version` is never referenced as a
-- compound key). They were never part of STAPLE's own schema either. This
-- restores MARKER's mirror of these two tables to match STAPLE's actual
-- shape exactly, leaving only the genuinely-used `Form.app` and the
-- STAPLE-owned `FormVersion.semantics` as remaining drift to reconcile via a
-- real migration in STAPLE's own repo.

-- DropIndex
DROP INDEX "FormVersion_formId_version_key";

-- AlterTable
ALTER TABLE "Form" DROP COLUMN "originalImportHash";

-- AlterTable
ALTER TABLE "FormVersion" DROP COLUMN "status",
DROP COLUMN "updatedAt";

-- CreateIndex
CREATE INDEX "formVersionIndex" ON "FormVersion"("formId", "version");
