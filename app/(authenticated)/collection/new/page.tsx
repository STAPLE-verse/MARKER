import { ADD_SCHEMA_METHODS } from "@/features/forms/add/methods";
import { AddSchemaMethodCards } from "@/features/forms/components/add/AddSchemaMethodCards";
import { SchemaFlowLayout } from "@/features/forms/components/add/SchemaFlowLayout";

export default function AddSchemaPage() {
  return (
    <SchemaFlowLayout
      backHref="/collection"
      backLabel="Back to Collection"
      backButtonPlacement="page-corner"
      title="Add schema"
      description="Choose how you want to add a metadata schema to your collection."
    >
      <AddSchemaMethodCards methods={ADD_SCHEMA_METHODS} />
    </SchemaFlowLayout>
  );
}
