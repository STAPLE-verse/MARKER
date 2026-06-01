import { Button } from "@/components/ui/Button";
import { SparklesIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-100 flex flex-col items-center justify-center p-4">
      <main className="max-w-2xl w-full text-center space-y-12 animate-in fade-in zoom-in duration-500">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-4">
            <SparklesIcon className="w-4 h-4" />
            v0.1.0-alpha
          </div>
          <h1 className="text-6xl font-extrabold tracking-tight lg:text-8xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary pb-4">
            MARKER
          </h1>
          <p className="text-2xl text-base-content/70 font-light leading-relaxed">
            Metadata archive for research knowledge exchange and reuse
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" wide>
              Login
            </Button>
          </Link>
          <Link href="/signup" className="w-full sm:w-auto">
            <Button variant="secondary" outline size="lg" wide>
              Sign Up
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
