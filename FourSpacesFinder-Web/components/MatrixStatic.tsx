import React from 'react';
import { Matrix } from '@/lib/math';
import { cn } from '@/lib/utils';

interface MatrixStaticProps {
  matrix: Matrix;
  headers?: string[];
  highlightCols?: Set<number>;
  className?: string;
}

export function MatrixStatic({ matrix, headers, highlightCols, className }: MatrixStaticProps) {
  return (
    <div className={cn("inline-flex flex-col items-center", className)}>
      {/* Headers */}
      {headers && (
        <div 
            className="grid gap-x-2 mb-1 w-full"
            style={{ gridTemplateColumns: `repeat(${matrix.cols}, minmax(max-content, 1fr))` }}
        >
            {headers.map((h, i) => (
                <div key={i} className="text-center text-[10px] font-bold text-gray-500 dark:text-gray-400 font-mono whitespace-nowrap px-1">
                    {h}
                </div>
            ))}
        </div>
      )}

      {/* Matrix Body */}
      <div className="relative px-2 py-1">
        {/* Brackets */}
        <div className="absolute top-0 bottom-0 left-0 w-2 border-l-2 border-t-2 border-b-2 border-gray-800 dark:border-gray-300 rounded-l-sm opacity-80" />
        <div className="absolute top-0 bottom-0 right-0 w-2 border-r-2 border-t-2 border-b-2 border-gray-800 dark:border-gray-300 rounded-r-sm opacity-80" />

        <div 
          className="grid gap-x-3 gap-y-1"
          style={{ gridTemplateColumns: `repeat(${matrix.cols}, minmax(max-content, 1fr))` }}
        >
          {matrix.data.map((row, r) => (
            row.map((val, c) => {
              const isHighlighted = highlightCols?.has(c);
              return (
                <div 
                  key={`${r}-${c}`}
                  className={cn(
                    "flex items-center justify-center min-w-[24px] min-h-[24px] px-1 font-mono text-[13px] font-medium whitespace-nowrap",
                    isHighlighted 
                        ? "text-blue-600 dark:text-blue-300 bg-blue-500/10 rounded" 
                        : "text-gray-900 dark:text-gray-100"
                  )}
                >
                  {val.toString()}
                </div>
              );
            })
          ))}
        </div>
      </div>
    </div>
  );
}
