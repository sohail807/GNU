import React from "react";

interface StatCardProps {
  kicker: string;
  label: string;
  value: string | number;
  subtext?: string;
  trend?: string;
  trendPositive?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  kicker,
  label,
  value,
  subtext,
  trend,
  trendPositive = true,
  icon,
  className = "",
}) => {
  return (
    <div
      className={`bg-white border border-slate-200/70 rounded-xl p-5 transition-shadow duration-200 hover:shadow-sm flex flex-col justify-between ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h4 className="text-xs font-medium text-slate-500">{label}</h4>
          {kicker && <span className="text-[10px] text-slate-400 mt-0.5 block">{kicker}</span>}
        </div>
        {icon && (
          <div className="text-slate-400 shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div>
        <div className="text-2xl font-semibold text-slate-900 tracking-tight">
          {value}
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
          {subtext && (
            <span className="text-slate-500 truncate">{subtext}</span>
          )}
          {trend && (
            <span
              className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
                trendPositive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
