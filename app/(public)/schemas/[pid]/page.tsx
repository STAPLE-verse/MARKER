import { notFound } from "next/navigation";
import { getPublishedSchemaByPid } from "@/features/forms/queries";
import SchemaDetailsClient from "./SchemaDetailsClient";

export default async function SchemaDetailsPage({ params }: { params: Promise<{ pid: string }> }) {
  const { pid } = await params;
  const schema = await getPublishedSchemaByPid(pid);

  if (!schema) notFound();

  return <SchemaDetailsClient schema={schema} />;
}
