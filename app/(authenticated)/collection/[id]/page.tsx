import { loadOwnedForm } from "@/features/forms/queries";
import UserSchemaDetailsClient from "./UserSchemaDetailsClient";

export default async function UserSchemaDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { form } = await loadOwnedForm(id);

  return <UserSchemaDetailsClient form={form} />;
}
