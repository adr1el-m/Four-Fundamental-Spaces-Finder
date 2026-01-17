import React from 'react';
import { cn } from '@/lib/utils';

interface VectorCardProps {
  vectorString: string;
  color?: string;
}

export function VectorCard({ vectorString, color }: VectorCardProps) {
  const lines = vectorString
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const values: string[] = [];
  for (const line of lines) {
    if (line.startsWith('(')) continue;
    if (line.startsWith('[') && line.endsWith(']')) {
      const inner = line.slice(1, -1).trim();
      if (inner.length > 0) values.push(inner);
      continue;
    }
    // Fallback
    if (line.length > 0) values.push(line);
  }

  if (values.length === 0) values.push("0");

  return (
    <div className="p-3 bg-white/40 backdrop-blur-md rounded-[14px] border border-white/30 shadow-sm dark:bg-white/5 dark:border-white/10 min-w-[60px] flex justify-center">
      <div className="relative inline-flex">
        <div className="absolute left-0 top-0 bottom-0 w-2 border-l-2 border-t-2 border-b-2 border-gray-800 rounded-l-sm dark:border-gray-200 opacity-80" />
        <div className="absolute right-0 top-0 bottom-0 w-2 border-r-2 border-t-2 border-b-2 border-gray-800 rounded-r-sm dark:border-gray-200 opacity-80" />

        <div className="flex flex-col items-center px-4 py-0.5 gap-1">
          {values.map((v, i) => (
            <span key={i} className={cn("font-mono font-medium text-[15px] leading-none min-w-[20px] text-center whitespace-nowrap", color)}>
              {v}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
