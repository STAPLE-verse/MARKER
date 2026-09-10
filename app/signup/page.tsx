import { sanitizeNextPath } from "@/utils/redirect";
import SignupForm from "./SignupForm";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return <SignupForm next={sanitizeNextPath(next)} />;
}
