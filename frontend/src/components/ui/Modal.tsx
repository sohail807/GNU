import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  kicker?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  size?: "sm" | "md" | "lg";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  kicker,
  children,
  maxWidth,
  size = "md",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Portal target must be resolved client-side only (SSR has no document.body).
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  if (!isOpen || !portalTarget) return null;

  const resolvedWidth = maxWidth
    ? {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
        "2xl": "max-w-2xl",
        "3xl": "max-w-3xl",
        "4xl": "max-w-4xl",
      }[maxWidth]
    : {
        sm: "max-w-md",
        md: "max-w-xl",
        lg: "max-w-3xl",
      }[size];

  // Rendered via a portal straight to document.body: a modal nested inside ordinary page
  // content inherits whatever CSS the page applies to its ancestors, and a `transform`
  // anywhere above it (even the identity matrix a `forwards`-filled CSS animation like
  // .animate-fade-in leaves behind after finishing) creates a new containing block --
  // silently breaking `position: fixed` so the dialog renders inside the page's document
  // flow instead of pinned to the viewport. Portaling sidesteps that class of bug entirely.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full ${resolvedWidth} bg-white border border-slate-200/90 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]`}
      >
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            {kicker && <div className="kicker text-[#0F766E] mb-0.5">{kicker}</div>}
            <h3 className="text-base font-bold text-[#0F172A] tracking-tight">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors focus:outline-none"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>,
    portalTarget
  );
};
