import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export type ToastType = "success" | "error" | "info" | "warning" | "notification";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  link?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/* Soft luxury audio chime using Web Audio API (no external MP3 asset required) */
function playLuxuryChime() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Harmonic bell tone
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(880, now); // A5
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.15); // D6

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  } catch {
    // AudioContext blocked or not supported
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const navigate = useNavigate();

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, link, duration = 5000 }: Omit<ToastItem, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setToasts((prev) => [...prev.slice(-4), { id, type, title, message, link, duration }]);

      // Play soft chime for new notifications
      if (type === "notification" || type === "success") {
        playLuxuryChime();
      }

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9, transition: { duration: 0.15 } }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={() => {
                if (toast.link) {
                  navigate(toast.link);
                  removeToast(toast.id);
                }
              }}
              className={`pointer-events-auto group relative overflow-hidden rounded-2xl border p-4 shadow-2xl backdrop-blur-2xl transition-all duration-200 cursor-pointer ${
                toast.type === "success"
                  ? "border-emerald-500/30 bg-[#0c1813]/90 shadow-emerald-500/10 hover:border-emerald-500/50"
                  : toast.type === "error"
                  ? "border-rose-500/30 bg-[#1a0c10]/90 shadow-rose-500/10 hover:border-rose-500/50"
                  : toast.type === "warning"
                  ? "border-amber-500/30 bg-[#18130c]/90 shadow-amber-500/10 hover:border-amber-500/50"
                  : toast.type === "notification"
                  ? "border-indigo-500/30 bg-[#0f1124]/90 shadow-indigo-500/10 hover:border-indigo-500/50"
                  : "border-white/10 bg-[#0e1017]/90 shadow-black/40 hover:border-white/20"
              }`}
            >
              {/* Top ambient highlight line */}
              <div
                className={`absolute inset-x-0 top-0 h-[1.5px] ${
                  toast.type === "success"
                    ? "bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                    : toast.type === "error"
                    ? "bg-gradient-to-r from-transparent via-rose-400 to-transparent"
                    : toast.type === "warning"
                    ? "bg-gradient-to-r from-transparent via-amber-400 to-transparent"
                    : toast.type === "notification"
                    ? "bg-gradient-to-r from-transparent via-indigo-400 to-transparent"
                    : "bg-gradient-to-r from-transparent via-white/40 to-transparent"
                }`}
              />

              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                    toast.type === "success"
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                      : toast.type === "error"
                      ? "border-rose-500/20 bg-rose-500/10 text-rose-300"
                      : toast.type === "warning"
                      ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
                      : toast.type === "notification"
                      ? "border-indigo-500/20 bg-indigo-500/10 text-indigo-300"
                      : "border-white/10 bg-white/5 text-white/70"
                  }`}
                >
                  {toast.type === "success" && <CheckCircle2 size={18} />}
                  {toast.type === "error" && <AlertTriangle size={18} />}
                  {toast.type === "warning" && <AlertTriangle size={18} />}
                  {toast.type === "notification" && <Sparkles size={18} />}
                  {toast.type === "info" && <Info size={18} />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="text-xs font-semibold text-white tracking-wide truncate">
                    {toast.title}
                  </h4>
                  {toast.message && (
                    <p className="mt-0.5 text-[11px] text-white/60 line-clamp-2 leading-relaxed">
                      {toast.message}
                    </p>
                  )}
                  {toast.link && (
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-indigo-300 group-hover:text-indigo-200">
                      <span>View details</span>
                      <ExternalLink size={10} />
                    </div>
                  )}
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeToast(toast.id);
                  }}
                  className="rounded-lg p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
