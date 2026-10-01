"use client";

import React, { useState, useEffect } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { OnboardingTourModal } from "./OnboardingTourModal";
import { ClientSession } from "@/lib/auth-session";

interface AppShellProps {
  user: ClientSession;
  children: React.ReactNode;
  isSuperAdmin?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({ user, children, isSuperAdmin = false }) => {
  const isTestInstance = process.env.NEXT_PUBLIC_DEPLOYMENT_MODE === "test";
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Check if user has seen onboarding tour on first visit
  useEffect(() => {
    const hasSeenTour = localStorage.getItem("ist_health_tour_completed");
    if (!hasSeenTour) {
      // Auto-trigger tour for first-time visitors after 1 second
      const timer = setTimeout(() => {
        setIsOnboardingOpen(true);
        localStorage.setItem("ist_health_tour_completed", "true");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Keyboard shortcut: ⌥S or Alt+S to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-[#0F172A] font-sans antialiased">
      {/* Collapsible Persistent Sidebar */}
      <AppSidebar
        user={user}
        isSuperAdmin={isSuperAdmin}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
      />

      {/* Main Clinical Content Shell */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AppHeader
          user={user}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onToggleMobileMenu={() => setIsMobileOpen(true)}
          onOpenOnboarding={() => setIsOnboardingOpen(true)}
        />

        <main className="flex-1 p-5 sm:p-7 lg:p-8 overflow-y-auto">
          {isTestInstance && (
            <div role="status" className="mb-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
              Isolated test environment. Do not use for patient care, live billing, or production operations.
            </div>
          )}
          {children}
        </main>
      </div>

      {/* Interactive System Onboarding Walkthrough */}
      <OnboardingTourModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />
    </div>
  );
};
