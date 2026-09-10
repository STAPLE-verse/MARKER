-- AlterTable
ALTER TABLE "MarkerForm" ALTER COLUMN "familyId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "MarkerForm_familyId_key" ON "MarkerForm"("familyId");

-- AlterTable
ALTER TABLE "MarkerFormVersion" ALTER COLUMN "versionId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "MarkerFormVersion_versionId_key" ON "MarkerFormVersion"("versionId");
