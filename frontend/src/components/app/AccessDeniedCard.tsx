"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Lock, Building2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AccessDeniedCardProps {
  moduleName: string;
  userRole: string;
  requiredRole?: string;
  defaultPath?: string;
}

export const AccessDeniedCard: React.FC<AccessDeniedCardProps> = ({
  moduleName,
  userRole,
  requiredRole = "Authorized Specialist or Administrator",
  defaultPath = "/frontdesk",
}) => {
  return (
    <div className="max-w-2xl mx-auto my-12 p-8 bg-white border border-rose-200 rounded-2xl shadow-sm text-center space-y-6 animate-fade-in">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-xs">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-xs font-mono font-bold text-rose-700 uppercase tracking-wider">
          <Lock className="w-3 h-3" />
          <span>Access Restricted</span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Access Restricted: {moduleName}
        </h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
          Your current staff role (<strong className="text-slate-900 uppercase font-mono">{userRole}</strong>) is not configured for <strong className="text-slate-900">{moduleName}</strong>. Backend permissions remain authoritative.
        </p>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-left font-mono space-y-1.5 max-w-md mx-auto">
        <div className="flex justify-between">
          <span className="text-slate-500">Required Clearance:</span>
          <span className="font-semibold text-slate-800">{requiredRole}</span>
        </div>
      </div>

      <div className="flex justify-center gap-3 pt-2">
        <Link href={defaultPath}>
          <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Return to Authorized Workspace
          </Button>
        </Link>
      </div>
    </div>
  );
};
