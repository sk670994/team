import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/app/auth/actions";

type AppShellProps = {
  children: React.ReactNode;
};

export async function AppShell({ children }: AppShellProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold">
            <FolderKanban className="h-5 w-5" />
            <span>Team Workspace</span>
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button asChild variant="ghost">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <form action={logoutAction}>
                  <Button type="submit">Logout</Button>
                </form>
              </>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Sign up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
