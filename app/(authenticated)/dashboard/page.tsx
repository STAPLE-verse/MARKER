import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default async function DashboardPage() {
  // auth() securely grabs the session on the server
  const session = await auth();

  // Protect the route: if no user is logged in, kick them back to login
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-base-200 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-base-100 p-6 rounded-2xl shadow-sm border border-base-300">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-base-content/70">
              Welcome back, {session.user.username || session.user.email}!
            </p>
          </div>
          
          <form
            action={async () => {
              "use server";
              // This built-in Auth.js function destroys the session and redirects
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button type="submit" variant="primary" outline>
              Sign out
            </Button>
          </form>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card title="Session Data" bordered className="border-primary/20 bg-base-100">
            <p className="text-sm text-base-content/80 mb-4">
              Here is the data burned into your secure JWT session cookie. Notice how the database isn't hit to get this!
            </p>
            <div className="bg-base-200 p-4 rounded-lg overflow-x-auto border border-base-300">
              <pre className="text-xs text-primary">
                {JSON.stringify(session.user, null, 2)}
              </pre>
            </div>
          </Card>

          <Card title="Ecosystem Integration" bordered className="border-secondary/20 bg-base-100">
            <p className="text-sm text-base-content/80 leading-relaxed">
              MARKER is now successfully connected to the STAPLE database! You can log in here using any existing STAPLE account credentials.
              <br /><br />
              <strong>Note on Single Sign-On:</strong> Because STAPLE uses Blitz.js (stateful database sessions) and MARKER uses Auth.js (stateless JWTs), true zero-click SSO is not active yet. In the future, we will add a custom bridge to translate STAPLE's session cookies into MARKER JWTs.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
