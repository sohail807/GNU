import React from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  className = "",
  id,
  rows = 4,
  ...props
}) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="text-xs font-semibold text-[#334155] tracking-tight flex items-center justify-between"
        >
          <span>{label}</span>
          {props.required && <span className="text-[#DC2626] text-xs">*</span>}
        </label>
      )}

      <textarea
        id={textareaId}
        rows={rows}
        className={`w-full p-3 text-sm bg-white text-[#0F172A] placeholder:text-[#94A3B8] border border-slate-300 rounded-lg transition-all duration-150 focus:outline-none focus:border-[#0F766E] focus:ring-3 focus:ring-[#0F766E]/15 disabled:bg-slate-50 disabled:text-[#94A3B8] ${
          error
            ? "border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/15"
            : ""
        } ${className}`}
        {...props}
      />

      {error ? (
        <p className="text-xs font-medium text-[#DC2626]">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[#64748B]">{helperText}</p>
      ) : null}
    </div>
  );
};
