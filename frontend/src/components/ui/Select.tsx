import React from "react";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Option[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  options,
  className = "",
  id,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-semibold text-[#334155] tracking-tight flex items-center justify-between"
        >
          <span>{label}</span>
          {props.required && <span className="text-[#DC2626] text-xs">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          className={`w-full h-10.5 text-sm bg-white text-[#0F172A] border border-slate-300 rounded-lg appearance-none pl-3.5 pr-10 transition-all duration-150 focus:outline-none focus:border-[#0F766E] focus:ring-3 focus:ring-[#0F766E]/15 disabled:bg-slate-50 disabled:text-[#94A3B8] disabled:cursor-not-allowed ${
            error
              ? "border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/15"
              : ""
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#94A3B8]">
          <ChevronDown className="w-4 h-4" />
        </span>
      </div>

      {error ? (
        <p className="text-xs font-medium text-[#DC2626]">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[#64748B]">{helperText}</p>
      ) : null}
    </div>
  );
};
