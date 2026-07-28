import Link from "next/link";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";

/**
 * Branded 404 for the authenticated route group. Rendered whenever a page calls
 * `notFound()` — most commonly `loadOwnedForm` for an invalid id, a missing
 * form, or a form the user doesn't own (see docs/architecture.md §8.9).
 */
export default function AuthenticatedNotFound() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl flex flex-col items-center text-center animate-in fade-in duration-300">
      <div className="rounded-full bg-base-content/5 p-4 mb-6">
        <MagnifyingGlassIcon className="h-10 w-10 text-base-content/60" strokeWidth={1.5} />
      </div>

      <p className="text-5xl font-bold text-primary mb-2">404</p>
      <h1 className="text-2xl font-bold mb-2">Schema not found</h1>
      <p className="text-base-content/70 mb-6">
        This schema doesn&apos;t exist, has been deleted, or isn&apos;t part of your collection.
      </p>

      <Link href="/collection">
        <Button variant="primary">Back to Collection</Button>
      </Link>
    </div>
  );
}
