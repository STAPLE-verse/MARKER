-- Reconciliation only, not a live schema change.
--
-- MARKER and STAPLE share one local development Postgres database. STAPLE's
-- own migration history already added `FormVersion.semantics` (a STAPLE-owned
-- table) directly against that shared database. MARKER's Prisma schema mirrors
-- STAPLE's `FormVersion` shape read-only but never tracked this column change
-- in MARKER's own migration history, so `prisma migrate dev` detected drift.
--
-- This migration documents that pre-existing, already-applied change so
-- MARKER's history matches reality. It is applied via `prisma migrate resolve
-- --applied` (recording it as already run), not executed — the column already
-- exists. Do not run this SQL directly; it would fail with "column already
-- exists" against any database where STAPLE's migration already ran, which is
-- every environment this repo currently targets.

-- AlterTable
ALTER TABLE "FormVersion" ADD COLUMN "semantics" JSONB;
