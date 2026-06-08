import { SparklesIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

// Dummy data for recent templates
const recentSchemas = [
  {
    pid: "ps_cognitive_assessment",
    title: "Cognitive Assessment Template",
    description: "Standard cognitive test protocol including memory recall...",
    version: "1.0.0",
    author: "Dr. Jane Doe",
    license: "CC-BY-4.0",
  },
  {
    pid: "ps_patient_demographics",
    title: "Patient Demographics Form",
    description: "Universal template for gathering baseline patient metadata...",
    version: "2.1.0",
    author: "Clinical Data Initiative",
    license: "CC0-1.0",
  },
  {
    pid: "ps_eeg_metadata",
    title: "EEG Recording Log",
    description: "Metadata descriptors for electroencephalography...",
    version: "1.2.0",
    author: "Neuroscience Lab",
    license: "MIT",
  },
];

export default async function Home() {
  const session = await auth();

  // If logged in, redirect to dashboard as the landing page
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-8 bg-gradient-to-br from-base-200 to-base-100">
      <main className="max-w-5xl mx-auto w-full space-y-12 animate-in fade-in zoom-in-95 duration-500 pt-8 sm:pt-12">
        {/* Header Section */}
        <div className="space-y-6 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-4">
            <SparklesIcon className="w-4 h-4" />
            v0.1.0-alpha
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary pb-4">
            MARKER
          </h1>
          <p className="text-xl text-base-content/80 font-light leading-relaxed">
            The open ecosystem for creating, discovering, and integrating standardized 
            metadata schemas into your research workflows.
          </p>
        </div>

        {/* Recent Templates Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-bold tracking-tight">Recent Templates</h2>
            <Link href="/explore">
              <Button variant="ghost" size="sm" className="text-primary gap-2">
                Explore all <ArrowRightIcon className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto bg-base-100 shadow-xl border border-base-200 rounded-2xl">
            <table className="table table-zebra w-full text-left">
              <thead>
                <tr className="bg-base-200/50 text-base-content/70">
                  <th className="font-semibold text-sm w-1/2 py-4">Title</th>
                  <th className="font-semibold text-sm">Version</th>
                  <th className="font-semibold text-sm">Author</th>
                  <th className="font-semibold text-sm">License</th>
                  <th className="font-semibold text-sm text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentSchemas.map((schema) => (
                  <tr key={schema.pid} className="hover:bg-base-200/30 transition-colors">
                    <td className="py-4">
                      <div className="font-bold text-base-content">{schema.title}</div>
                      <div className="text-sm text-base-content/60 truncate max-w-sm mt-1">
                        {schema.description}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-secondary badge-outline badge-sm font-mono">
                        v{schema.version}
                      </span>
                    </td>
                    <td className="text-base-content/80">{schema.author}</td>
                    <td>
                      <span className="badge badge-accent badge-sm">{schema.license}</span>
                    </td>
                    <td className="text-right">
                      <Link href={`/schemas/${schema.pid}`}>
                        <Button variant="ghost" size="sm" className="hover:text-primary">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Call to action */}
          <div className="flex justify-center pt-8">
            <Link href="/explore">
              <Button variant="primary" outline size="lg" className="gap-2 rounded-full px-8">
                Explore The Full Catalog <ArrowRightIcon className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
