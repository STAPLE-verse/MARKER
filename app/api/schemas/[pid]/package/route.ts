import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Returns the marker-template-spec Core V1 (+ Semantic V1, when present)
 * package for a published schema — the exact, immutable snapshot assembled
 * and validated at publish time (`PublishedSchemaPackage`), not recomputed
 * on every request. True same-URL content negotiation via `middleware.ts` on
 * `/schemas/[pid]` is out of scope (that page is still mock data) — this is
 * a standalone endpoint with its own real query.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ pid: string }> }) {
  const { pid } = await params;

  const snapshot = await prisma.publishedSchemaPackage.findUnique({ where: { pid } });

  if (!snapshot) {
    return NextResponse.json({ error: "Schema not found" }, { status: 404 });
  }

  return NextResponse.json(snapshot.packageJson);
}
