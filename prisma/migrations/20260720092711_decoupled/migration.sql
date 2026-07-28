-- CreateEnum
CREATE TYPE "MarkerFormOrigin" AS ENUM ('NATIVE', 'IMPORTED_STAPLE', 'IMPORTED_EXTERNAL');

-- CreateEnum
CREATE TYPE "MarkerFormCollaboratorRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

-- DropForeignKey
ALTER TABLE "PublicationMetadata" DROP CONSTRAINT "PublicationMetadata_formVersionId_fkey";

-- DropForeignKey
ALTER TABLE "PublishedSchema" DROP CONSTRAINT "PublishedSchema_originFormVersionId_fkey";

-- AlterTable
ALTER TABLE "PublishedSchema" ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "externalSourceUrl" TEXT;

-- CreateTable
CREATE TABLE "MarkerForm" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "tags" JSONB,
    "origin" "MarkerFormOrigin" NOT NULL DEFAULT 'NATIVE',
    "externalSourceSystem" TEXT,
    "externalId" TEXT,
    "externalSourceUrl" TEXT,
    "importedFromStapleFormId" INTEGER,
    "importedFromStapleVersionNumber" INTEGER,
    "importedAt" TIMESTAMP(3),
    "originalImportHash" TEXT,

    CONSTRAINT "MarkerForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarkerFormVersion" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "formId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "schema" JSONB NOT NULL,
    "uiSchema" JSONB,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "VersionStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "MarkerFormVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarkerFormCollaborator" (
    "id" SERIAL NOT NULL,
    "formId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" "MarkerFormCollaboratorRole" NOT NULL DEFAULT 'VIEWER',
    "invitedById" INTEGER,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "MarkerFormCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarkerFolder" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" INTEGER NOT NULL,

    CONSTRAINT "MarkerFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarkerFormFolderPlacement" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "formId" INTEGER NOT NULL,
    "folderId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "MarkerFormFolderPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarkerForm_ownerId_idx" ON "MarkerForm"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "MarkerFormVersion_formId_version_key" ON "MarkerFormVersion"("formId", "version");

-- CreateIndex
CREATE INDEX "MarkerFormCollaborator_userId_idx" ON "MarkerFormCollaborator"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MarkerFormCollaborator_formId_userId_key" ON "MarkerFormCollaborator"("formId", "userId");

-- CreateIndex
CREATE INDEX "MarkerFolder_ownerId_idx" ON "MarkerFolder"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "MarkerFolder_name_ownerId_key" ON "MarkerFolder"("name", "ownerId");

-- CreateIndex
CREATE INDEX "MarkerFormFolderPlacement_folderId_idx" ON "MarkerFormFolderPlacement"("folderId");

-- CreateIndex
CREATE INDEX "MarkerFormFolderPlacement_userId_idx" ON "MarkerFormFolderPlacement"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MarkerFormFolderPlacement_formId_userId_key" ON "MarkerFormFolderPlacement"("formId", "userId");

-- AddForeignKey
ALTER TABLE "MarkerForm" ADD CONSTRAINT "MarkerForm_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarkerFormVersion" ADD CONSTRAINT "MarkerFormVersion_formId_fkey" FOREIGN KEY ("formId") REFERENCES "MarkerForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarkerFormCollaborator" ADD CONSTRAINT "MarkerFormCollaborator_formId_fkey" FOREIGN KEY ("formId") REFERENCES "MarkerForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarkerFormCollaborator" ADD CONSTRAINT "MarkerFormCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarkerFolder" ADD CONSTRAINT "MarkerFolder_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarkerFormFolderPlacement" ADD CONSTRAINT "MarkerFormFolderPlacement_formId_fkey" FOREIGN KEY ("formId") REFERENCES "MarkerForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarkerFormFolderPlacement" ADD CONSTRAINT "MarkerFormFolderPlacement_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "MarkerFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarkerFormFolderPlacement" ADD CONSTRAINT "MarkerFormFolderPlacement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationMetadata" ADD CONSTRAINT "PublicationMetadata_formVersionId_fkey" FOREIGN KEY ("formVersionId") REFERENCES "MarkerFormVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishedSchema" ADD CONSTRAINT "PublishedSchema_originFormVersionId_fkey" FOREIGN KEY ("originFormVersionId") REFERENCES "MarkerFormVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
