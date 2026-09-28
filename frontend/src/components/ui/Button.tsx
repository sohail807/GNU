import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "dark" | "secondary" | "outline" | "ghost" | "danger";
  size?: "xs" | "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-lg cursor-pointer";

  const sizeStyles = {
    xs: "px-2.5 py-1 text-xs gap-1.5 h-7 font-medium",
    sm: "px-3 py-1.5 text-xs gap-1.5 h-8.5 font-medium",
    md: "px-4 py-2 text-sm gap-2 h-10 font-medium",
    lg: "px-5 py-2.5 text-sm gap-2.5 h-11 font-medium",
  };

  const variantStyles = {
    primary:
      "bg-[#0F766E] text-white hover:bg-[#115E59] active:bg-[#134E4A] focus:ring-[#0F766E]/25",
    dark:
      "bg-[#1E293B] text-white hover:bg-[#0F172A] active:bg-[#0F172A] focus:ring-[#1E293B]/25",
    secondary:
      "bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-200 focus:ring-slate-300",
    outline:
      "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 focus:ring-slate-300",
    ghost:
      "bg-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 focus:ring-slate-300",
    danger:
      "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-500/25",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-3.5 w-3.5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Processing...</span>
        </span>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
