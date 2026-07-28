/**
 * Suspense fallback for the authenticated route group. Shown while async server
 * pages (collection list/detail, etc.) stream in. Polish, not error handling.
 */
export default function AuthenticatedLoading() {
  return (
    <div className="flex-1 w-full flex items-center justify-center py-24">
      <span className="loading loading-spinner text-primary loading-lg" />
    </div>
  );
}
