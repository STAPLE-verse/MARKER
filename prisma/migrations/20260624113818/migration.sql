/*
  Warnings:

  - A unique constraint covering the columns `[formId,version]` on the table `FormVersion` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "formVersionIndex";

-- CreateIndex
CREATE UNIQUE INDEX "FormVersion_formId_version_key" ON "FormVersion"("formId", "version");
