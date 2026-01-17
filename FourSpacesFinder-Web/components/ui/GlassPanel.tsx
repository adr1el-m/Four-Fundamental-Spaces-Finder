import React from 'react';
import { cn } from '@/lib/utils';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassPanel({ children, className }: GlassPanelProps) {
  return (
    <div className={cn(
      "p-4 rounded-[18px] bg-white/60 backdrop-blur-xl border border-white/20 shadow-sm",
      "dark:bg-black/20 dark:border-white/10",
      className
    )}>
      {children}
    </div>
  );
}
