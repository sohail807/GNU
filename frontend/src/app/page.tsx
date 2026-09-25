import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-session";

export default async function RootPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  // If authenticated, navigate directly to Front Desk or user's role landing
  redirect("/frontdesk");
}
