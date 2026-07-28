import { redirect } from "next/navigation";
import { loadOwnedForm } from "@/features/forms/queries";
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
  const { form } = await loadOwnedForm(id);

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

  return <UserSchemaDetailsClient form={form} selectedVersion={selectedVersion} />;
}
