/*
  Warnings:

  - Made the column `contributors` on table `PublishedSchema` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "PublishedSchema" ALTER COLUMN "contributors" SET NOT NULL;
