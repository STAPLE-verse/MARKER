/*
  Warnings:

  - You are about to drop the column `runtimeVersion` on the `PublishedSchemaPackage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PublishedSchemaPackage" DROP COLUMN "runtimeVersion";
