import { getLatestVersionForConformanceCheck, getPublishedVersionsForForm, loadOwnedForm } from "@/features/forms/queries";
import { getUserProfile } from "@/features/users/queries/getUserProfile";
import { assembleDraftPackage, formatDiagnosticsForUser, validateTemplatePackage } from "@/features/forms/utils/templatePackage";
import PublishSchemaClient from "./PublishSchemaClient";
import { SchemaConformanceBlocked } from "./components/SchemaConformanceBlocked";

export default async function PublishSchemaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId, form } = await loadOwnedForm(id);

  const latestVersion = form.versions[0];

  // Entry gate (docs/refactor/publish-wizard-refactor.md, Phase 3a): the
  // wizard only edits FAIR metadata/contributors, never schema/uiSchema, so
  // a Core V1 form-schema-profile failure isn't fixable there at all. Check
  // it here, before the wizard even opens, and route to the schema editor
  // instead. Metadata is deliberately left out of this package — a draft
  // with no FAIR metadata yet is normal and shouldn't block entry; that
  // half is covered by zod at every wizard step instead (see Phase 2).
  const conformanceCheck = await getLatestVersionForConformanceCheck(form.id, userId);
  if (conformanceCheck) {
    const draftPackage = assembleDraftPackage({
      familyId: conformanceCheck.familyId,
      versionId: conformanceCheck.versionId,
      version: String(conformanceCheck.version),
      title: conformanceCheck.name || "Untitled Schema",
      schema: conformanceCheck.schema,
      uiSchema: conformanceCheck.uiSchema,
      semantics: conformanceCheck.semantics,
      createdAt: conformanceCheck.createdAt,
      updatedAt: conformanceCheck.updatedAt,
    });
    const diagnostics = validateTemplatePackage(draftPackage);
    if (diagnostics.length > 0) {
      return (
        <SchemaConformanceBlocked
          formId={form.id}
          message={formatDiagnosticsForUser(diagnostics)}
        />
      );
    }
  }

  const user = await getUserProfile(userId);

  const isProfileIncomplete = !user?.firstName || !user?.lastName || !user?.orcid;
  const publishedVersions = await getPublishedVersionsForForm(form.id);

  return (
    <PublishSchemaClient
      formId={form.id}
      version={latestVersion}
      publishedVersions={publishedVersions}
      currentUser={{
        givenName: user?.firstName || "",
        familyName: user?.lastName || "",
        orcid: user?.orcid || "",
        institution: user?.institution || "",
        isProfileIncomplete
      }}
    />
  );
}
