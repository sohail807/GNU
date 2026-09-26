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
    sm: "px-2 py-0.5 text-[11px] gap-1.25",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3 py-1 text-xs gap-1.5 font-medium",
  };

  // Softer tints, no border shout - a quiet status cue rather than a label.
  const variantStyles = {
    green: "bg-emerald-50 text-emerald-700",
    teal: "bg-teal-50 text-teal-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    red: "bg-red-50 text-red-700",
    neutral: "bg-slate-100 text-slate-600",
    purple: "bg-purple-50 text-purple-700",
  };

  const dotStyles = {
    green: "bg-emerald-500",
    teal: "bg-teal-500",
    amber: "bg-amber-500",
    blue: "bg-blue-500",
    red: "bg-red-500",
    neutral: "bg-slate-400",
    purple: "bg-purple-500",
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full shrink-0 ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
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
