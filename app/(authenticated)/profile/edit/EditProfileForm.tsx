"use client";

import React, { useEffect, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useRouter } from "next/navigation";
import {
  PROFILE_LANGUAGE_OPTIONS,
  PROFILE_THEME_OPTIONS,
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
    control,
    formState: { errors, isSubmitting },
  } = form;

  const { save } = useUpdateProfile(form);

  // Live preview: apply the selected theme to the whole app immediately, but
  // only as a preview — restore whatever theme was active on mount if the
  // selection isn't saved, so it never sticks. The unmount cleanup below
  // covers nav-away via the navbar or browser back; `handleCancel` reverts
  // explicitly and synchronously for the Cancel button itself, since App
  // Router's client-side navigation doesn't reliably unmount (and run that
  // cleanup) before the next paint.
  const originalThemeRef = useRef<string | null>(null);
  const previewedTheme = useWatch({ control, name: "theme" });

  useEffect(() => {
    const root = document.documentElement;
    originalThemeRef.current = root.getAttribute("data-theme");
    return () => {
      if (originalThemeRef.current) root.setAttribute("data-theme", originalThemeRef.current);
    };
  }, []);

  useEffect(() => {
    if (previewedTheme) {
      document.documentElement.setAttribute("data-theme", previewedTheme);
    }
  }, [previewedTheme]);

  const handleCancel = () => {
    if (originalThemeRef.current) {
      document.documentElement.setAttribute("data-theme", originalThemeRef.current);
    }
    router.push("/profile");
  };

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
                label="Username"
                placeholder="e.g. cooldev99"
                {...register("username")}
                error={errors.username?.message}
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="name@example.com"
                helperText="Also your login email."
                {...register("email")}
                error={errors.email?.message}
              />
            </div>

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

            <Input
              label="Gravatar Email"
              type="email"
              placeholder="e.g. name@example.com"
              helperText="Optional. Used only to look up your Gravatar picture — it can be different from your login email."
              {...register("gravatar")}
              error={errors.gravatar?.message}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Preferred Language"
                options={PROFILE_LANGUAGE_OPTIONS}
                {...register("language")}
                error={errors.language?.message}
              />
              <Select
                label="Theme"
                options={PROFILE_THEME_OPTIONS}
                {...register("theme")}
                error={errors.theme?.message}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" type="button" onClick={handleCancel}>
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
