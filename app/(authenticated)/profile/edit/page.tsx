"use client";

import React from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const router = useRouter();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Real implementation will save to Prisma via server action
    router.push("/profile");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl animate-in fade-in duration-300">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => router.push("/profile")} size="sm">
          ← Back to Profile
        </Button>
      </div>

      <PageHeader
        title="Edit Profile"
        description="Update your personal details and academic credentials."
      />

      <Card bordered>
        <CardBody>
          <CardTitle className="text-xl mb-4">Profile Information</CardTitle>
          <form className="space-y-4" onSubmit={handleSave}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="First Name" placeholder="e.g. Jane" />
              <Input label="Last Name" placeholder="e.g. Doe" />
            </div>

            <Input
              label="Institution"
              placeholder="e.g. University of California, Berkeley"
            />

            <Input
              label="ORCID iD"
              placeholder="e.g. 0000-0002-1825-0097"
              helperText="Optional. Connecting your ORCID identifier makes your published templates citeable."
            />

            <div>
              <label className="label">
                <span className="label-text font-medium">Preferred Language</span>
              </label>
              <select
                defaultValue="en-US"
                className="select select-bordered w-full"
              >
                <option value="en-US">English (United States)</option>
                <option value="en-GB">English (United Kingdom)</option>
                <option value="hu-HU">Hungarian (Magyar)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" type="button" onClick={() => router.push("/profile")}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
