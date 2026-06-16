import { notFound } from "next/navigation";
import { requirePageAuth } from "@/utils/auth";
import { getFormById } from "@/features/forms/queries/getFormById";
import UserSchemaDetailsClient from "./UserSchemaDetailsClient";

export default async function UserSchemaDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await requirePageAuth();

  const resolvedParams = await params;
  const formId = parseInt(resolvedParams.id, 10);
  if (isNaN(formId)) return notFound();

  const form = await getFormById(formId, userId);
  if (!form || form.versions.length === 0) return notFound();

  return <UserSchemaDetailsClient form={form} />;
}
