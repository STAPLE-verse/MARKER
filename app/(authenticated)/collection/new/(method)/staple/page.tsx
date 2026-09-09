import { requirePageAuth } from "@/utils/auth";
import { getStapleImportOptions } from "@/features/forms/imports/queries/getStapleImportOptions";
import { StapleImportTable } from "@/features/forms/components/add/StapleImportTable";
import { SchemaFlowLayout } from "@/features/forms/components/add/SchemaFlowLayout";

export default async function StapleImportPage() {
  const { userId } = await requirePageAuth();
  const forms = await getStapleImportOptions(userId);

  return (
    <SchemaFlowLayout
      backHref="/collection/new"
      backLabel="Back to add schema"
      backButtonPlacement="page-corner"
      title="Import from STAPLE"
      description="Copy one version of a STAPLE form you own into MARKER. This creates an independent snapshot — it does not stay in sync with STAPLE."
    >
      <StapleImportTable forms={forms} />
    </SchemaFlowLayout>
  );
}
