import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getPublishedSchemaByPid } from "@/features/forms/queries";
import type { PublicPublishedSchemaDTO } from "@/features/forms/types";
import SchemaDetailsClient from "./SchemaDetailsClient";

export default async function SchemaDetailsPage({ params }: { params: Promise<{ pid: string }> }) {
  // `params` and `auth()` are independent — resolve them together, same as
  // the `params`+`searchParams` pattern in collection/[id]/page.tsx — then
  // fetch the schema, which does depend on `pid`.
  const [{ pid }, session] = await Promise.all([params, auth()]);
  const schema = await getPublishedSchemaByPid(pid);

  if (!schema) notFound();

  const viewerUserId = session?.user?.id ? Number(session.user.id) : null;
  const viewerIsAuthor = viewerUserId !== null && viewerUserId === schema.authorId;
  const viewerFormId = viewerIsAuthor ? schema.originFormId : null;
  const viewerVersionId = viewerIsAuthor ? schema.originVersionId : null;

  // Built explicitly (not `{ authorId, originFormId, ...rest }`) so
  // authorId/originFormId — resolved into the three viewer-state values
  // above, and never meant to reach the client (authorId is another user's
  // numeric id whenever the viewer isn't the author) — can't leak through
  // by accident if PublishedSchemaDetailDTO ever grows a new field.
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
      viewerIsAuthor={viewerIsAuthor}
      viewerFormId={viewerFormId}
      viewerVersionId={viewerVersionId}
    />
  );
}
