import React from 'react';
import { CalculationStep } from '@/lib/math';
import { cn } from '@/lib/utils';

interface StepViewProps {
  step: CalculationStep;
  pivotColumns: Set<number>;
  highlightPivots: boolean;
}

export function StepView({ step, pivotColumns, highlightPivots }: StepViewProps) {
  const { matrixState, isPivotStep } = step;
  
  return (
    <div className={cn(
      "p-3 rounded-xl border transition-all duration-200",
      isPivotStep 
        ? "bg-white/10 border-white/30 shadow-md dark:bg-white/5 dark:border-white/10" 
        : "bg-white/5 border-white/20 dark:bg-white/5 dark:border-white/5"
    )}>
      <div 
        className="grid gap-x-2 gap-y-1"
        style={{ gridTemplateColumns: `repeat(${matrixState.cols}, minmax(0, 1fr))` }}
      >
        {matrixState.data.map((row, r) => (
          row.map((val, c) => {
            const isHighlighted = highlightPivots && pivotColumns.has(c);
            return (
              <div 
                key={`${r}-${c}`}
                className={cn(
                  "flex items-center justify-center w-[36px] h-[24px] rounded font-mono text-[13px] font-medium",
                  isHighlighted ? "bg-blue-500/10 text-blue-900 dark:text-blue-100 dark:bg-blue-500/20" : "text-gray-900 dark:text-gray-100"
                )}
              >
                {val.toString()}
              </div>
            );
          })
        ))}
      </div>
    </div>
  );
}
