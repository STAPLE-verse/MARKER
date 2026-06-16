"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useRouter } from "next/navigation";
import { createForm } from "@/features/forms/mutations/createForm";

export default function NewSchemaPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleCreateDraft = async () => {
    try {
      setIsPending(true);
      const formId = await createForm({ title, description });
      router.push(`/collection/${formId}/edit`);
    } catch (error) {
      console.error("Failed to create draft:", error);
      setIsPending(false);
    }
  };



  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl animate-in fade-in duration-300">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => router.back()} size="sm">
          ← Back to Collection
        </Button>
      </div>

      <PageHeader
        title="Create Schema"
        description="Choose how you want to create your new metadata schema."
      />

      <Card bordered>
        <CardBody>
          <CardTitle className="text-xl">Schema Information</CardTitle>
          <form action={handleCreateDraft} className="space-y-4 mt-2">
            <Input 
              label="Draft Name" 
              placeholder="e.g. Cognitive Assessment Form" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required 
            />
            <Input 
              label="Description (Optional)" 
              placeholder="Internal notes for this draft..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" type="button" onClick={() => router.push("/collection")} disabled={isPending}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create Draft & Open Builder"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
