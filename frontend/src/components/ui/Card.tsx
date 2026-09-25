import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = "" }) => {
  return (
    <div
      className={`bg-white border border-slate-200/80 rounded-xl shadow-2xs ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title: string;
  kicker?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, kicker, description, action, className = "" }) => {
  return (
    <div
      className={`p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}
    >
      <div>
        {kicker && <div className="kicker text-[#0F766E] mb-1">{kicker}</div>}
        <h3 className="text-lg font-bold text-[#0F172A] tracking-tight">{title}</h3>
        {description && (
          <p className="text-xs text-[#64748B] mt-0.5">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export const CardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  return <div className={`p-6 ${className}`}>{children}</div>;
};
