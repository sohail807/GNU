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
      className={`bg-white border border-slate-200/80 rounded-xl p-5.5 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className="kicker text-[#0F766E] text-[10px] tracking-wider block mb-1">
            {kicker}
          </span>
          <h4 className="text-xs font-semibold text-[#475569]">{label}</h4>
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-[#F0FDFA] text-[#0F766E] flex items-center justify-center shrink-0 border border-[#99F6E4]/40">
            {icon}
          </div>
        )}
      </div>

      <div>
        <div className="text-3xl font-extrabold text-[#0F172A] tracking-tight font-sans">
          {value}
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
          {subtext && (
            <span className="text-[#64748B] font-medium truncate">{subtext}</span>
          )}
          {trend && (
            <span
              className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                trendPositive
                  ? "bg-[#ECFDF5] text-[#047857]"
                  : "bg-[#FEF2F2] text-[#B91C1C]"
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
