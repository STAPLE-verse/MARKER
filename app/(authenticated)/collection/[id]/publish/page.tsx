import { loadOwnedForm } from "@/features/forms/queries";
import { getUserProfile } from "@/features/users/queries/getUserProfile";
import PublishSchemaClient from "./PublishSchemaClient";

export default async function PublishSchemaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId, form } = await loadOwnedForm(id);

  const latestVersion = form.versions[0];

  const user = await getUserProfile(userId);
  
  const authorName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  const isProfileIncomplete = !user?.firstName || !user?.lastName || !user?.orcid;

  return (
    <PublishSchemaClient 
      formId={form.id} 
      version={latestVersion}
      currentUser={{ 
        name: authorName || "", 
        orcid: user?.orcid || "",
        isProfileIncomplete
      }}
    />
  );
}
