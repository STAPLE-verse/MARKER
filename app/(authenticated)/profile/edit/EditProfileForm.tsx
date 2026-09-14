"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useRouter } from "next/navigation";
import {
  PROFILE_LANGUAGE_OPTIONS,
  updateProfileSchema,
  type UpdateProfileFormData,
} from "@/features/users/schemas";
import { useUpdateProfile } from "@/features/users/hooks/useUpdateProfile";

interface EditProfileFormProps {
  initialValues: UpdateProfileFormData;
}

export default function EditProfileForm({ initialValues }: EditProfileFormProps) {
  const router = useRouter();

  const form = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: initialValues,
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const { save } = useUpdateProfile(form);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl animate-in fade-in duration-300">
      <PageHeader
        title="Edit Profile"
        description="Update your personal details and academic credentials."
      />

      <Card bordered>
        <CardBody>
          <CardTitle className="text-xl mb-4">Profile Information</CardTitle>
          <form className="space-y-4" onSubmit={handleSubmit(save)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                placeholder="e.g. Jane"
                {...register("firstName")}
                error={errors.firstName?.message}
              />
              <Input
                label="Last Name"
                placeholder="e.g. Doe"
                {...register("lastName")}
                error={errors.lastName?.message}
              />
            </div>

            <Input
              label="Institution"
              placeholder="e.g. University of California, Berkeley"
              {...register("institution")}
              error={errors.institution?.message}
            />

            <Input
              label="ORCID iD"
              placeholder="e.g. 0000-0002-1825-0097"
              helperText="Optional. Connecting your ORCID identifier makes your published templates citeable."
              {...register("orcid")}
              error={errors.orcid?.message}
            />

            <Select
              label="Preferred Language"
              options={PROFILE_LANGUAGE_OPTIONS}
              {...register("language")}
              error={errors.language?.message}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" type="button" onClick={() => router.push("/profile")}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
