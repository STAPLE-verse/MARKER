"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useRouter } from "next/navigation";

interface StapleFormMock {
  id: number;
  name: string;
  versionCount: number;
  lastUpdated: string;
}

export default function NewSchemaPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"scratch" | "staple" | "upload">("scratch");

  // Mock STAPLE forms that belong to the user
  const mockStapleForms: StapleFormMock[] = [
    { id: 101, name: "Cognitive Performance Log", versionCount: 3, lastUpdated: "2026-06-01" },
    { id: 102, name: "Lab Experiment Metadata", versionCount: 1, lastUpdated: "2026-05-15" },
    { id: 103, name: "Clinical Study Survey", versionCount: 5, lastUpdated: "2026-06-03" },
  ];

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

      <div className="tabs tabs-boxed mb-6 bg-base-300 p-1">
        <button
          className={`tab flex-1 font-semibold ${activeTab === "scratch" ? "tab-active bg-primary text-primary-content" : ""}`}
          onClick={() => setActiveTab("scratch")}
        >
          Create From Scratch
        </button>
        <button
          className={`tab flex-1 font-semibold ${activeTab === "staple" ? "tab-active bg-primary text-primary-content" : ""}`}
          onClick={() => setActiveTab("staple")}
        >
          Import from STAPLE
        </button>
        <button
          className={`tab flex-1 font-semibold ${activeTab === "upload" ? "tab-active bg-primary text-primary-content" : ""}`}
          onClick={() => setActiveTab("upload")}
        >
          Upload JSON File
        </button>
      </div>

      {activeTab === "scratch" && (
        <Card bordered>
          <CardBody>
            <CardTitle className="text-xl">Schema Information</CardTitle>
            <form className="space-y-4 mt-2" onSubmit={(e) => { e.preventDefault(); router.push("/collection"); }}>
              <Input label="Title" placeholder="e.g. Cognitive Assessment Form" required />
              <Input label="Description" placeholder="Provide a brief description of the schema's purpose..." />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Initial Version" defaultValue="0.1.0" required />
                <Input label="License" defaultValue="CC-BY-4.0" required />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="ghost" type="button" onClick={() => router.push("/collection")}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Create Draft & Open Builder
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {activeTab === "staple" && (
        <Card bordered>
          <CardBody>
            <CardTitle className="text-xl">Import from STAPLE Workspace</CardTitle>
            <p className="text-sm text-base-content/70 mb-4">
              Below are the forms found in your STAPLE workspace database. Select a form to import as a MARKER schema draft.
            </p>
            <div className="overflow-x-auto border border-base-200 rounded-lg">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Form Name</th>
                    <th>Versions</th>
                    <th>Last Updated</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockStapleForms.map((form) => (
                    <tr key={form.id} className="hover">
                      <td className="font-bold">{form.name}</td>
                      <td>{form.versionCount} versions</td>
                      <td>{form.lastUpdated}</td>
                      <td className="text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            // Import action goes here
                            router.push("/collection");
                          }}
                        >
                          Import
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === "upload" && (
        <Card bordered>
          <CardBody>
            <CardTitle className="text-xl">Upload JSON Schema</CardTitle>
            <p className="text-sm text-base-content/70 mb-4">
              Select a valid JSON Schema draft-07 file from your local system.
            </p>
            <div className="border-2 border-dashed border-base-300 rounded-lg p-8 flex flex-col items-center justify-center bg-base-200/50 hover:bg-base-200 transition-colors">
              <input type="file" className="file-input file-input-bordered file-input-primary w-full max-w-xs" />
              <p className="text-xs text-base-content/50 mt-2">Only .json files are accepted</p>
            </div>
            <div className="flex justify-end gap-2 pt-4 mt-4">
              <Button variant="ghost" type="button" onClick={() => router.push("/collection")}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => router.push("/collection")}>
                Parse & Upload
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
