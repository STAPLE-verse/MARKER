"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { Form } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { useCreateForm } from "@/features/forms/hooks/useCreateForm";
import {
  createFormSchema,
  type CreateFormInput,
} from "@/features/forms/schemas";

export function CreateBlankDraftForm() {
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
    <Card bordered>
      <CardBody>
        <CardTitle className="text-xl">Schema information</CardTitle>
        <Form form={form} onSubmit={create} className="mt-2 space-y-4">
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
            <Button
              variant="ghost"
              type="button"
              onClick={() => router.push("/collection")}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Draft & Open Builder"}
            </Button>
          </div>
        </Form>
      </CardBody>
    </Card>
  );
}
