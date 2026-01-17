import React from 'react';

interface MatrixInputProps {
  rows: number;
  cols: number;
  values: string[];
  onChange: (index: number, val: string) => void;
}

export function MatrixInput({ rows, cols, values, onChange }: MatrixInputProps) {
  return (
    <div 
      className="grid gap-3 mx-auto"
      style={{ 
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        maxWidth: `${cols * 70}px`
      }}
    >
      {Array.from({ length: rows * cols }).map((_, i) => (
        <input
          key={i}
          type="text"
          value={values[i]}
          onChange={(e) => onChange(i, e.target.value)}
          className="w-[62px] h-[42px] text-center font-mono font-semibold text-[15px] bg-white/50 border border-white/40 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm transition-all hover:bg-white/60 dark:bg-white/10 dark:border-white/10 dark:text-white"
        />
      ))}
    </div>
  );
}
