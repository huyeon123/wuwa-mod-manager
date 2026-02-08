import { useState, useCallback } from "react";
import { X, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

export interface ToastData {
  id: string;
  type: "success" | "warning" | "error";
  message: string;
  showReport?: boolean;
}

// Alias for backward compatibility
export type Toast = ToastData;

interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

interface ToastItemProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const { id, type, message, showReport } = toast;

  const handleReport = () => {
    window.open(
      "https://github.com/user/wuwa-mod-manager/issues/new",
      "_blank"
    );
  };

  const typeConfig = {
    success: {
      icon: CheckCircle,
      iconColor: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
    },
    warning: {
      icon: AlertTriangle,
      iconColor: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
    },
    error: {
      icon: XCircle,
      iconColor: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm
        ${config.bgColor} ${config.borderColor} bg-background-card/90
        shadow-lg animate-in slide-in-from-top-2 duration-300
        min-w-[320px] max-w-[480px]
      `}
    >
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary leading-relaxed break-words">
          {message}
        </p>
        {showReport && type === "error" && (
          <button
            onClick={handleReport}
            className="mt-2 text-xs text-neon hover:text-neon/80 font-medium transition-colors"
          >
            문제 신고하기 →
          </button>
        )}
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
        aria-label="닫기"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback(
    (type: ToastData["type"], message: string, showReport?: boolean) => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, type, message, showReport }]);
      if (type !== "error") {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
      }
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, dismissToast };
}
