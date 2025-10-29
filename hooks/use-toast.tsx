import React, { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/utils';

const TOAST_REMOVE_DELAY = 5000;

interface ToastProps {
  id: number;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToastContextType {
  toast: (options: Omit<ToastProps, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastCount = 0;

const ToasterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastProps[]>([]);

    const toast = useCallback(({ title, description, variant = 'default' }: Omit<ToastProps, 'id'>) => {
        const id = toastCount++;
        setToasts(prevToasts => [...prevToasts, { id, title, description, variant }]);

        setTimeout(() => {
            setToasts(prevToasts => prevToasts.filter(t => t.id !== id));
        }, TOAST_REMOVE_DELAY);
    }, []);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <Toaster toasts={toasts} />
        </ToastContext.Provider>
    );
};

const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const Toaster: React.FC<{ toasts: ToastProps[] }> = ({ toasts }) => {
    const portalRoot = document.body;
    if (!portalRoot) return null;

    return createPortal(
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
            {toasts.map(toast => (
                <Toast key={toast.id} {...toast} />
            ))}
        </div>,
        portalRoot
    );
};

const Toast: React.FC<ToastProps> = ({ title, description, variant }) => {
    const baseClasses = "p-4 rounded-md shadow-lg border w-full";
    const variantClasses = {
        default: 'bg-[hsl(var(--card))] border-[hsl(var(--border))] text-[hsl(var(--foreground))]',
        destructive: 'bg-[hsl(var(--destructive))] border-transparent text-[hsl(var(--destructive-foreground))]',
    };

    return (
        <div className={cn(baseClasses, variantClasses[variant || 'default'])}>
            <p className="font-semibold">{title}</p>
            {description && <p className="text-sm opacity-90">{description}</p>}
        </div>
    );
};

export { ToasterProvider, useToast, Toaster };