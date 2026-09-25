import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "green" | "amber" | "blue" | "red" | "neutral" | "purple" | "teal";
  size?: "sm" | "md" | "lg";
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  size = "sm",
  dot = false,
  className = "",
}) => {
  const sizeStyles = {
    sm: "px-2.5 py-0.5 text-[11px] gap-1.5",
    md: "px-3 py-1 text-xs gap-1.5",
    lg: "px-3.5 py-1.5 text-xs gap-2 font-semibold",
  };

  const variantStyles = {
    green: "bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]",
    teal: "bg-[#F0FDFA] text-[#0F766E] border border-[#99F6E4]",
    amber: "bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]",
    blue: "bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]",
    red: "bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]",
    neutral: "bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]",
    purple: "bg-[#FAF5FF] text-[#7E22CE] border border-[#E9D5FF]",
  };

  const dotStyles = {
    green: "bg-[#10B981]",
    teal: "bg-[#0D9488]",
    amber: "bg-[#F59E0B]",
    blue: "bg-[#3B82F6]",
    red: "bg-[#EF4444]",
    neutral: "bg-[#64748B]",
    purple: "bg-[#A855F7]",
  };

  return (
    <span
      className={`inline-flex items-center font-medium font-mono uppercase tracking-wider rounded-full shrink-0 ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyles[variant]}`}
        />
      )}
      <span>{children}</span>
    </span>
  );
};
