import { sanitizeNextPath } from "@/utils/redirect";
import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return <LoginForm next={sanitizeNextPath(next)} />;
}
