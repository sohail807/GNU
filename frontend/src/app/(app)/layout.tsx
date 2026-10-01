import React from "react";
import { getSession, toClientSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { isSuperAdmin } from "@/lib/platform";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // The page data is visible to the browser, so it gets a stripped-down user (never the backend session token).
  // If not authenticated, redirect to login
  if (!session) {
    redirect("/login");
  }

  // Computed server-side (it reads SUPER_ADMIN_USERNAMES, a non-public env var) and passed down
  // as a plain boolean -- the client sidebar never sees the allow-list itself, just whether this
  // particular session is on it.
  return (
    <AppShell user={toClientSession(session)} isSuperAdmin={isSuperAdmin(session)}>
      {children}
    </AppShell>
  );
}
