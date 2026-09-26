import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | IST Health — Enterprise Outpatient HMIS",
    default: "IST Health | Enterprise Hospital Management & Clinical Intelligence System",
  },
  description:
    "Tier-1 Enterprise Hospital Management Information System (HMIS). Real-time clinical workflows, zero-trust cryptographic security, and precision outpatient management.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-[#0F172A] font-sans selection:bg-[#0D9488]/20 selection:text-[#0F766E]">
        {children}
      </body>
    </html>
  );
}
