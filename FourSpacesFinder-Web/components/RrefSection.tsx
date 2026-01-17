import React, { useState } from 'react';
import { CalculationStep, matrixToLatex } from '@/lib/math';
import { GlassPanel } from './ui/GlassPanel';
import { StepView } from './StepView';
import { ArrowRight } from 'lucide-react';
import { copyToClipboard } from '@/lib/utils';

interface RrefSectionProps {
  title: string;
  steps: CalculationStep[];
  pivots: number[];
  isTranspose: boolean;
}

function StepArrow({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 min-w-[50px]">
      {label && (
        <span className="px-2 py-1 text-[11px] font-bold bg-white/40 backdrop-blur-sm rounded-full border border-white/20 dark:bg-white/10 dark:text-gray-200">
          {label}
        </span>
      )}
      <div className="flex items-center justify-center w-10 h-7 bg-white/40 backdrop-blur-sm rounded-full border border-white/20 dark:bg-white/10">
        <ArrowRight className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
      </div>
    </div>
  );
}

function RrefFinalTag({ isTranspose }: { isTranspose: boolean }) {
    return (
        <div className="flex items-center px-2 py-1 bg-white/40 backdrop-blur-sm rounded-full border border-white/20 dark:bg-white/10 w-fit mb-2">
            <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                {isTranspose ? (
                    <>
                        RREF A<sup className="ml-0.5">T</sup>
                    </>
                ) : (
                    "RREF"
                )}
            </span>
        </div>
    )
}

export function RrefSection({ title, steps, pivots, isTranspose }: RrefSectionProps) {
  const pivotSet = new Set(pivots);
  const [copied, setCopied] = useState(false);

  const latexizeOperation = (raw: string) => {
    const s = raw.trim();
    if (s.length === 0) return '';
    const m = s.match(/^E(\d+)(\d+)\((.+)\)$/);
    if (m) {
      const a = m[1];
      const b = m[2];
      let k = m[3].trim();
      k = k.replace(/(-?\d+)\/(\d+)/g, (_mm, n, d) => {
        const nn = parseInt(n, 10);
        if (nn < 0) return `-\\frac{${Math.abs(nn)}}{${d}}`;
        return `\\frac{${nn}}{${d}}`;
      });
      return `E_{${a}${b}}\\left(${k}\\right)`;
    }
    return s;
  };

  const buildRrefProcessLatex = () => {
    if (steps.length === 0) return '';
    const baseLabel = isTranspose ? 'A^T' : 'A';
    const lines: string[] = [];
    lines.push(`${baseLabel} &= ${matrixToLatex(steps[0].matrixState)}`);
    for (let i = 1; i < steps.length; i++) {
      const op = latexizeOperation(steps[i].description);
      if (op.length > 0) {
        lines.push(`&\\xrightarrow{${op}} ${matrixToLatex(steps[i].matrixState)}`);
      } else {
        lines.push(`&\\rightarrow ${matrixToLatex(steps[i].matrixState)}`);
      }
    }
    return `\\begin{aligned}\n${lines.join('\\\\\n')}\n\\end{aligned}`;
  };

  return (
    <GlassPanel>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        {steps.length > 0 && (
          <button
            type="button"
            onClick={async () => {
              await copyToClipboard(buildRrefProcessLatex());
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1200);
            }}
            className="px-3 py-1.5 text-[11px] font-bold bg-white/40 backdrop-blur-sm rounded-full border border-white/20 text-gray-800 hover:bg-white/50 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15"
          >
            {copied ? 'Copied' : 'Copy LaTeX'}
          </button>
        )}
      </div>

      {steps.length === 0 ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">Waiting...</p>
      ) : (
        <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          <div className="flex items-center gap-3 w-max px-1">
            {steps.map((step, i) => {
              const isLast = i === steps.length - 1; // True last step of total
              const isFirst = i === 0;
              
              return (
                <React.Fragment key={step.id}>
                  {isLast ? (
                     <div className="flex flex-col">
                        <RrefFinalTag isTranspose={isTranspose} />
                        <StepView 
                            step={step} 
                            pivotColumns={pivotSet} 
                            highlightPivots={true} 
                        />
                     </div>
                  ) : (
                    <div>
                        <StepView 
                            step={step} 
                            pivotColumns={pivotSet} 
                            highlightPivots={isFirst} 
                        />
                    </div>
                  )}
                  
                  {i < steps.length - 1 && (
                    <StepArrow label={steps[i + 1].description} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </GlassPanel>
  );
}
