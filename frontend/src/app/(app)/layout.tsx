import React from "react";
import { getSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // If not authenticated, redirect to login
  if (!session) {
    redirect("/login");
  }

  return <AppShell user={session}>{children}</AppShell>;
}
