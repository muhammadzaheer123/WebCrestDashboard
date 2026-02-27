import { Trash2 } from "lucide-react";
import { useEffect } from "react";

export function ConfirmDeleteModal({
  open,
  onClose,
  onConfirm,
  loading,
  title,
  description,
  meta,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  title?: string;
  description?: string;
  meta?: string;
}) {
  useEffect(() => {
    if (!open) return;

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* modal */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#0B0616] shadow-[0_30px_120px_rgba(0,0,0,0.8)]">
        {/* glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-[260px] w-[260px] -translate-x-1/2 rounded-full bg-rose-500/15 blur-[90px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-[240px] w-[240px] rounded-full bg-[#7C3AED]/12 blur-[100px]" />

        <div className="relative p-6">
          {/* icon */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-500/10">
            <Trash2 className="h-6 w-6 text-rose-200" />
          </div>

          <h3 className="mt-4 text-center text-lg font-semibold text-white">
            {title ?? "Delete"}
          </h3>

          <p className="mt-2 text-center text-sm text-white/60">
            {description ??
              "Are you sure you want to delete this item? This action cannot be undone."}
          </p>

          {meta ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-xs text-white/70">
              {meta}
            </div>
          ) : null}

          {/* actions */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={onClose}
              disabled={!!loading}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/85 hover:bg-white/10 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              onClick={onConfirm}
              disabled={!!loading}
              className="rounded-2xl bg-gradient-to-r from-rose-500 to-rose-700 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(244,63,94,0.20)] hover:opacity-95 disabled:opacity-50"
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
