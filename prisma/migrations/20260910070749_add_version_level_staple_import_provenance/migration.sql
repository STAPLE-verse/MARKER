-- AlterTable
ALTER TABLE "MarkerFormVersion" ADD COLUMN     "importedAt" TIMESTAMP(3),
ADD COLUMN     "importedFromStapleVersionNumber" INTEGER;
