-- CreateTable
CREATE TABLE "PublicationMetadata" (
    "id" SERIAL NOT NULL,
    "formVersionId" INTEGER NOT NULL,
    "domain" TEXT,
    "language" TEXT,
    "license" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contributors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicationMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PublicationMetadata_formVersionId_key" ON "PublicationMetadata"("formVersionId");

-- AddForeignKey
ALTER TABLE "PublicationMetadata" ADD CONSTRAINT "PublicationMetadata_formVersionId_fkey" FOREIGN KEY ("formVersionId") REFERENCES "FormVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
