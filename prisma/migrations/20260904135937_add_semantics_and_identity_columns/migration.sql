-- AlterTable
ALTER TABLE "MarkerForm" ADD COLUMN     "familyId" TEXT;

-- AlterTable
ALTER TABLE "MarkerFormVersion" ADD COLUMN     "semantics" JSONB,
ADD COLUMN     "versionId" TEXT;
