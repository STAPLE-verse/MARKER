import { CreateBlankDraftForm } from "@/features/forms/components/add/CreateBlankDraftForm";
import { SchemaFlowLayout } from "@/features/forms/components/add/SchemaFlowLayout";

export default function CreateBlankDraftPage() {
  return (
    <SchemaFlowLayout
      backHref="/collection/new"
      backLabel="Back to add schema"
      backButtonPlacement="page-corner"
      title="Create blank draft"
      description="Start a new MARKER schema and open it in the form builder."
    >
      <CreateBlankDraftForm />
    </SchemaFlowLayout>
  );
}
