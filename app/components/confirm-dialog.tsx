import type { FC } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export const ConfirmDialog: FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  destructive = false,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-pointer border-none p-0"
        onClick={onCancel}
        aria-label="Close dialog"
      />

      {/* Dialog */}
      <div className="relative bg-abyss-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold text-slate-100 mb-2">{title}</h3>
        <p className="text-slate-400 text-sm mb-6">{description}</p>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
              destructive
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-neon-blue hover:bg-neon-blue/80 text-white"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
