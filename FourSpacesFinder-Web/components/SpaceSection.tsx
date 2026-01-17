import React, { useState } from 'react';
import { GlassPanel } from './ui/GlassPanel';
import { VectorCard } from './VectorCard';
import { cn, copyToClipboard } from '@/lib/utils';
import { vectorStringToLatex } from '@/lib/math';

interface SpaceSectionProps {
  title: string;
  vectors: string[];
  explanation?: string;
  color?: string; // Tailwind text color class for title/accents
  children?: React.ReactNode;
}

export function SpaceSection({ title, vectors, explanation, color = "text-gray-900", children }: SpaceSectionProps) {
  const [copied, setCopied] = useState(false);

  return (
    <GlassPanel>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full opacity-60 bg-current", color)} />
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
        
        {/* Only show Copy button if no children (meaning it's Column Space or simple view) and vectors exist */}
        {!children && vectors.length > 0 && (
          <button
            type="button"
            onClick={async () => {
              const vectorsLatex = vectors.map(vectorStringToLatex).join(', ');
              const spaceName = title.split(' ')[0]; // e.g. "Column"
              const latex = 
                `\\begin{aligned}\n` +
                `\\text{${spaceName} Space } &= \\mathrm{span}\\langle ${vectorsLatex} \\rangle\n` +
                `\\end{aligned}`;
              await copyToClipboard(latex);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1200);
            }}
            className="px-3 py-1.5 text-[11px] font-bold bg-white/40 backdrop-blur-sm rounded-full border border-white/20 text-gray-800 hover:bg-white/50 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15"
          >
            {copied ? 'Copied' : 'Copy LaTeX'}
          </button>
        )}
      </div>
      
      {explanation && (
        <p className="text-xs text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
          {explanation}
        </p>
      )}

      {children ? (
        children
      ) : vectors.length === 0 ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">Waiting...</p>
      ) : (
        <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          <div className="flex items-start gap-4 w-max">
            {vectors.map((vec, i) => (
              <VectorCard key={i} vectorString={vec} color={color} />
            ))}
          </div>
        </div>
      )}
    </GlassPanel>
  );
}
