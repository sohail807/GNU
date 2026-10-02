import React from "react";
import { getSession } from "@/lib/auth-session";
import { AccessDeniedCard } from "@/components/app/AccessDeniedCard";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return (
      <AccessDeniedCard
        moduleName="User Administration"
        userRole={session?.role || "unauthenticated"}
        requiredRole="Health System Administrator"
      />
    );
  }
  return children;
}
