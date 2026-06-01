import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ServerStackIcon, ShareIcon, SparklesIcon } from "@heroicons/react/24/outline";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-100 flex flex-col items-center justify-center p-4 sm:p-8">
      <main className="max-w-5xl w-full space-y-12">
        
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-4">
            <SparklesIcon className="w-4 h-4" />
            v0.1.0-alpha
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight lg:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary pb-2">
            MARKER Platform
          </h1>
          <p className="text-xl text-base-content/70 max-w-2xl mx-auto leading-relaxed">
            A federated, highly scalable module built for the STAPLE ecosystem. 
            Independent by design, seamlessly integrated by choice.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          <Card bordered className="border-primary/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <ServerStackIcon className="w-6 h-6" />
              </div>
              <h2 className="card-title text-2xl font-bold m-0">Independent Database</h2>
            </div>
            <p className="text-base-content/80 mb-8 leading-relaxed">
              MARKER runs on its own dedicated PostgreSQL database and authenticates standalone or via shared session tokens.
            </p>
            <div className="card-actions justify-end">
              <Button variant="primary">Deploy Infrastructure</Button>
            </div>
          </Card>

          <Card bordered className="border-secondary/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
                <ShareIcon className="w-6 h-6" />
              </div>
              <h2 className="card-title text-2xl font-bold m-0">Shared UI Library</h2>
            </div>
            <p className="text-base-content/80 mb-8 leading-relaxed">
              UI Components are isolated in a dedicated folder, strictly designed to be extracted into a shared NPM package for STAPLE.
            </p>
            <div className="card-actions justify-end">
              <Button variant="secondary" outline>Browse Components</Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
