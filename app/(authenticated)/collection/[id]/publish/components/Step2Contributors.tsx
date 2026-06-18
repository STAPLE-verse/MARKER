import { Button } from "@/components/ui/Button";
import { WizardStep } from "@/components/ui/WizardStep";

export function Step2Contributors() {
  return (
    <WizardStep 
      title="Contributors" 
      description="List the authors and maintainers of this schema. ORCIDs are highly recommended."
    >
      {/* Placeholder for the complex array builder */}
      <div className="border-2 border-dashed border-base-300 rounded-xl p-8 bg-base-50/50 flex flex-col justify-center items-center h-56 transition-colors hover:border-primary/50">
        <div className="text-center">
          <p className="text-base-content/40 font-mono text-sm mb-4">{"<ContributorArrayBuilder />"}</p>
          <Button variant="secondary" outline size="sm" type="button">+ Add Contributor</Button>
        </div>
      </div>
    </WizardStep>
  );
}
