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
    <div className="max-w-md mx-auto my-12 p-8 bg-white border border-slate-200 rounded-2xl shadow-sm text-center space-y-5 animate-fade-in">
      <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
        <ShieldAlert className="w-6 h-6" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-xs font-medium text-rose-600">
          <Lock className="w-3 h-3" />
          <span>Access restricted</span>
        </div>
        <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
          {moduleName}
        </h2>
        <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          Your current role (<span className="text-slate-700 font-medium capitalize">{userRole}</span>) isn't configured for {moduleName}. Backend permissions remain authoritative.
        </p>
      </div>

      <div className="px-4 py-3 bg-slate-50 rounded-xl text-xs text-left space-y-1 max-w-sm mx-auto">
        <div className="flex justify-between">
          <span className="text-slate-400">Required role</span>
          <span className="font-medium text-slate-700">{requiredRole}</span>
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
