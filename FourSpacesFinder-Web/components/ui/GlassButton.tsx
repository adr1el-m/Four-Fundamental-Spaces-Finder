import React from 'react';
import { cn } from '@/lib/utils';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export function GlassButton({ children, className, variant = 'primary', ...props }: GlassButtonProps) {
  return (
    <button
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-[13px] transition-all duration-200",
        "active:scale-95 shadow-md hover:shadow-lg backdrop-blur-md",
        variant === 'primary' 
          ? "bg-white/40 hover:bg-white/50 text-gray-900 border border-white/50 dark:bg-white/10 dark:text-white dark:border-white/20"
          : "bg-white/20 hover:bg-white/30 text-gray-700 border border-white/30 dark:bg-white/5 dark:text-gray-300 dark:border-white/10",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
