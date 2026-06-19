import { notFound } from "next/navigation";
import { requirePageAuth } from "@/utils/auth";
import { getFormById } from "@/features/forms/queries/getFormById";
import { getUserProfile } from "@/features/users/queries/getUserProfile";
import PublishSchemaClient from "./PublishSchemaClient";

export default async function PublishSchemaPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await requirePageAuth();

  const resolvedParams = await params;
  const formId = parseInt(resolvedParams.id, 10);
  if (isNaN(formId)) return notFound();

  const form = await getFormById(formId, userId);
  if (!form || form.versions.length === 0) return notFound();

  const latestVersion = form.versions[0];

  const user = await getUserProfile(userId);
  
  const authorName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  const isProfileIncomplete = !user?.firstName || !user?.lastName || !user?.orcid;

  return (
    <PublishSchemaClient 
      formId={form.id} 
      formName={latestVersion.name || "Untitled Form"}
      formVersion={latestVersion.version}
      currentUser={{ 
        name: authorName || "", 
        orcid: user?.orcid || "",
        isProfileIncomplete
      }}
    />
  );
}
