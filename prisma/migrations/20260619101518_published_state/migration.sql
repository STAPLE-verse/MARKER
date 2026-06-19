-- CreateEnum
CREATE TYPE "VersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "FormVersion" ADD COLUMN     "status" "VersionStatus" NOT NULL DEFAULT 'DRAFT';

-- AddForeignKey
ALTER TABLE "PublishedSchema" ADD CONSTRAINT "PublishedSchema_originFormVersionId_fkey" FOREIGN KEY ("originFormVersionId") REFERENCES "FormVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
