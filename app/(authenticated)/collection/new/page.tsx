"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Form } from "@/components/ui/Form";
import { useCreateForm } from "@/features/forms/hooks/useCreateForm";
import { createFormSchema, CreateFormInput } from "@/features/forms/schemas";

export default function NewSchemaPage() {
  const router = useRouter();

  const form = useForm<CreateFormInput>({
    resolver: zodResolver(createFormSchema),
    defaultValues: { title: "", description: "" },
  });

  const {
    register,
    formState: { errors },
  } = form;

  const { create, isCreating } = useCreateForm(form);

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
          <Form form={form} onSubmit={create} className="space-y-4 mt-2">
            <Input
              label="Draft Name"
              placeholder="e.g. Cognitive Assessment Form"
              error={errors.title?.message}
              {...register("title")}
            />
            <Input
              label="Description (Optional)"
              placeholder="Internal notes for this draft..."
              error={errors.description?.message}
              {...register("description")}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" type="button" onClick={() => router.push("/collection")} disabled={isCreating}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Draft & Open Builder"}
              </Button>
            </div>
          </Form>
        </CardBody>
      </Card>
    </div>
  );
}
