import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn.js';

export const toastVariants = cva(
  'pointer-events-auto relative flex w-full items-center justify-between space-x-3 overflow-hidden rounded-[var(--radius-card)] p-4 shadow-float border transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full text-[14px]',
  {
    variants: {
      variant: {
        info: 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)]',
        success:
          'bg-[var(--color-success-tint)] border-[var(--color-success)] text-[var(--color-success)]',
        warning:
          'bg-[var(--color-warning-tint)] border-[var(--color-warning)] text-[var(--color-warning)]',
        error:
          'bg-[var(--color-danger-tint)] border-[var(--color-danger)] text-[var(--color-danger)]',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  },
);

const toastIcons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toast: (toast: Omit<ToastItem, 'id'>) => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const addToast = React.useCallback((newToast: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...newToast, id }]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {toasts.map(({ id, title, description, variant = 'info', action }) => {
          const Icon = toastIcons[variant];
          return (
            <ToastPrimitive.Root
              key={id}
              className={cn(toastVariants({ variant }))}
              onOpenChange={(open) => {
                if (!open) removeToast(id);
              }}
            >
              <div className="flex items-start gap-3">
                <Icon className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex flex-col gap-0.5">
                  <ToastPrimitive.Title className="font-semibold text-[14px]">
                    {title}
                  </ToastPrimitive.Title>
                  {description && (
                    <ToastPrimitive.Description className="text-[12px] opacity-90">
                      {description}
                    </ToastPrimitive.Description>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {action && (
                  <ToastPrimitive.Action
                    asChild
                    altText={action.label}
                    onClick={action.onClick}
                  >
                    <button className="px-2.5 py-1 text-[12px] font-semibold underline hover:no-underline">
                      {action.label}
                    </button>
                  </ToastPrimitive.Action>
                )}
                <ToastPrimitive.Close
                  className="rounded-[var(--radius-control)] p-1 opacity-70 hover:opacity-100 min-h-[36px] min-w-[36px] inline-flex items-center justify-center"
                  aria-label="Close notification"
                >
                  <X className="h-4 w-4" />
                </ToastPrimitive.Close>
              </div>
            </ToastPrimitive.Root>
          );
        })}
        <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
};
