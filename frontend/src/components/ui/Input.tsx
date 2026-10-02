import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = "",
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-[#334155] tracking-tight flex items-center justify-between"
        >
          <span>{label}</span>
          {props.required && <span className="text-[#DC2626] text-xs">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3.5 text-[#94A3B8] pointer-events-none shrink-0">
            {leftIcon}
          </span>
        )}

        <input
          id={inputId}
          className={`w-full h-10.5 text-sm bg-white text-[#0F172A] placeholder:text-[#94A3B8] border border-slate-300 rounded-lg transition-all duration-150 focus:outline-none focus:border-[#0F766E] focus:ring-3 focus:ring-[#0F766E]/15 disabled:bg-slate-50 disabled:text-[#94A3B8] disabled:cursor-not-allowed ${
            leftIcon ? "pl-10" : "px-3.5"
          } ${rightIcon ? "pr-10" : "px-3.5"} ${
            error
              ? "border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/15"
              : ""
          } ${className}`}
          {...props}
        />

        {rightIcon && (
          <span className="absolute right-3.5 text-[#94A3B8] shrink-0">
            {rightIcon}
          </span>
        )}
      </div>

      {error ? (
        <p className="text-xs font-medium text-[#DC2626] flex items-center gap-1">
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-[#64748B]">{helperText}</p>
      ) : null}
    </div>
  );
};
