import { redirect } from "next/navigation";
import { loadOwnedForm } from "@/features/forms/queries";
import { getCollaborationSummary } from "@/features/forms/collaborators/queries/getCollaborationSummary";
import UserSchemaDetailsClient from "./UserSchemaDetailsClient";

interface UserSchemaDetailsPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ version?: string | string[] }>;
}

export default async function UserSchemaDetailsPage({
  params,
  searchParams,
}: UserSchemaDetailsPageProps) {
  const [{ id }, { version: versionParam }] = await Promise.all([params, searchParams]);
  const { userId, form } = await loadOwnedForm(id);
  // A still-pending invitee isn't a member yet — don't hand their client
  // bundle the full collaborator list (privacy: they haven't accepted, so
  // they shouldn't see who else has access), and there's nothing here for
  // them to act on anyway (CollaborationHeaderControls isn't rendered for
  // them; see UserSchemaDetailsClient).
  const collaboration = form.isPendingInvite ? null : await getCollaborationSummary(form.id, form.ownerId);

  const latestVersion = form.versions[0];
  let selectedVersion = latestVersion;

  if (versionParam !== undefined) {
    const versionId =
      typeof versionParam === "string" && /^\d+$/.test(versionParam)
        ? Number(versionParam)
        : Number.NaN;

    const requestedVersion = Number.isSafeInteger(versionId)
      ? form.versions.find((version) => version.id === versionId)
      : undefined;

    if (!requestedVersion || requestedVersion.id === latestVersion.id) {
      redirect(`/collection/${form.id}`);
    }

    selectedVersion = requestedVersion;
  }

  return (
    <UserSchemaDetailsClient
      form={form}
      selectedVersion={selectedVersion}
      viewerUserId={userId}
      collaboration={collaboration}
    />
  );
}
