import { sanitizeNextPath } from "@/utils/redirect";
import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; registered?: string }>;
}) {
  const { next, registered } = await searchParams;

  return <LoginForm next={sanitizeNextPath(next)} justRegistered={registered === "1"} />;
}
