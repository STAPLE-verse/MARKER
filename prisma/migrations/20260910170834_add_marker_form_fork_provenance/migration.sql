-- AlterEnum
ALTER TYPE "MarkerFormOrigin" ADD VALUE 'FORKED';

-- AlterTable
ALTER TABLE "MarkerForm" ADD COLUMN     "forkedAt" TIMESTAMP(3),
ADD COLUMN     "forkedFromPid" TEXT;
