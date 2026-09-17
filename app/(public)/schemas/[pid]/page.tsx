import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getPublishedSchemaByPid, getViewerFormAccess } from "@/features/forms/queries";
import type { PublicPublishedSchemaDTO } from "@/features/forms/types";
import SchemaDetailsClient from "./SchemaDetailsClient";

interface SchemaDetailsPageProps {
  params: Promise<{ pid: string }>;
  searchParams: Promise<{ fromForm?: string }>;
}

export default async function SchemaDetailsPage({ params, searchParams }: SchemaDetailsPageProps) {
  // `params`, `searchParams`, and `auth()` are independent — resolve them
  // together, same as the `params`+`searchParams` pattern in
  // collection/[id]/page.tsx — then fetch the schema, which does depend on `pid`.
  const [{ pid }, { fromForm }, session] = await Promise.all([params, searchParams, auth()]);
  const schema = await getPublishedSchemaByPid(pid);

  if (!schema) notFound();

  // Where "Back" should return to, when this page was reached from a form's
  // own detail page (SchemaDetailHeader's "View Public URL"/"Forked" links)
  // rather than a public listing like /explore. `/collection/[id]` does its
  // own ownership check, so this doesn't need validating against
  // viewerFormId here — an invalid or spoofed id just 404s there, same as
  // typing any other bad id into that route directly.
  const backFormId = fromForm && /^\d+$/.test(fromForm) ? Number(fromForm) : null;

  const viewerUserId = session?.user?.id ? Number(session.user.id) : null;
  // Live access, not `schema.authorId` (frozen at publish time — wrong for
  // both a collaborator who never published it themselves, and for the
  // *current* owner after an ownership transfer). null when logged out, the
  // form has since been deleted (`originFormId` null), or the viewer simply
  // has no access.
  const viewerHasFormAccess =
    viewerUserId !== null && schema.originFormId !== null
      ? await getViewerFormAccess(schema.originFormId, viewerUserId)
      : null;
  const viewerFormId = viewerHasFormAccess ? schema.originFormId : null;
  const viewerVersionId = viewerHasFormAccess ? schema.originVersionId : null;

  // Built explicitly (not `{ authorId, originFormId, ...rest }`) so
  // authorId/originFormId — resolved into the viewer-state values above, and
  // never meant to reach the client (authorId is another user's numeric id
  // whenever the viewer isn't that user) — can't leak through by accident if
  // PublishedSchemaDetailDTO ever grows a new field.
  const publicSchema: PublicPublishedSchemaDTO = {
    pid: schema.pid,
    title: schema.title,
    description: schema.description,
    version: schema.version,
    license: schema.license,
    domain: schema.domain,
    language: schema.language,
    keywords: schema.keywords,
    contributors: schema.contributors,
    releaseNotes: schema.releaseNotes,
    relatedPublicationDoi: schema.relatedPublicationDoi,
    schema: schema.schema,
    uiSchema: schema.uiSchema,
    createdAt: schema.createdAt,
    versions: schema.versions,
    forkedFrom: schema.forkedFrom,
  };

  return (
    <SchemaDetailsClient
      schema={publicSchema}
      isLoggedIn={viewerUserId !== null}
      viewerFormId={viewerFormId}
      viewerVersionId={viewerVersionId}
      backFormId={backFormId}
    />
  );
}
