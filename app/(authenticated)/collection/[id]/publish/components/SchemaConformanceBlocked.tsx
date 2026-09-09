import Link from "next/link";
import { FormPageLayout } from "@/features/forms/components/FormPageLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { BackButton } from "@/components/ui/BackButton";

interface SchemaConformanceBlockedProps {
  formId: number;
  message: string;
}

/**
 * Shown instead of the publish wizard when the draft's schema/uiSchema
 * doesn't conform to marker-template-spec Core V1 (see
 * docs/refactor/publish-wizard-refactor.md, Phase 3a). Not fixable from the
 * wizard at all — it doesn't render the schema — so this routes back to the
 * schema editor instead of opening a wizard that can't help.
 */
export function SchemaConformanceBlocked({ formId, message }: SchemaConformanceBlockedProps) {
  return (
    <FormPageLayout
      backButton={
        <BackButton href={`/collection/${formId}`}>Back to Collection</BackButton>
      }
    >
      <PageHeader title="Can't publish yet" />

      <Card bordered className="shadow-sm">
        <CardBody className="p-6 md:p-10">
          <Alert variant="error" title="Schema doesn't meet publishing requirements">
            {message}
          </Alert>

          <p className="mt-6 text-sm text-base-content/70">
            This needs to be fixed in the schema editor before this version can be
            published — the publish wizard only edits FAIR metadata and
            contributors, not the schema itself.
          </p>

          <div className="mt-6">
            <Link href={`/collection/${formId}/edit`}>
              <Button variant="primary">Go to Schema Editor</Button>
            </Link>
          </div>
        </CardBody>
      </Card>
    </FormPageLayout>
  );
}
