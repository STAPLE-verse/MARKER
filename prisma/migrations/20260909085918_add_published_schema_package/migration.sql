-- CreateTable
CREATE TABLE "PublishedSchemaPackage" (
    "pid" TEXT NOT NULL,
    "packageJson" JSONB NOT NULL,
    "runtimeVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublishedSchemaPackage_pkey" PRIMARY KEY ("pid")
);

-- AddForeignKey
ALTER TABLE "PublishedSchemaPackage" ADD CONSTRAINT "PublishedSchemaPackage_pid_fkey" FOREIGN KEY ("pid") REFERENCES "PublishedSchema"("pid") ON DELETE CASCADE ON UPDATE CASCADE;
