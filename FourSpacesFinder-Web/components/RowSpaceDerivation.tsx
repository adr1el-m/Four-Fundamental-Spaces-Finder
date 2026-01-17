import React, { useState } from 'react';
import { Matrix, matrixToLatex, vectorStringToLatex } from '@/lib/math';
import { MatrixStatic } from './MatrixStatic';
import { VectorCard } from './VectorCard';
import { copyToClipboard } from '@/lib/utils';

interface RowSpaceDerivationProps {
  transposeMatrix: Matrix;
  transposeRrefMatrix: Matrix;
  basisVectors: string[];
}

export function RowSpaceDerivation({ transposeMatrix, transposeRrefMatrix, basisVectors }: RowSpaceDerivationProps) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="w-full">
      <div className="flex justify-end mb-2">
        <button
          type="button"
          onClick={async () => {
            const vectorsLatex = basisVectors.map(vectorStringToLatex).join(', ');
            
            // Single-line format where possible
            let latex = `A^T = ${matrixToLatex(transposeMatrix)} \\quad \\implies \\quad `;
            latex += `\\mathrm{rref}(A^T) = ${matrixToLatex(transposeRrefMatrix)} \\quad \\implies \\quad `;
            latex += `R(A) = \\mathrm{span}\\langle ${vectorsLatex} \\rangle`;

            await copyToClipboard(latex);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
          }}
          className="px-3 py-1.5 text-[11px] font-bold bg-white/40 backdrop-blur-sm rounded-full border border-white/20 text-gray-800 hover:bg-white/50 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15"
        >
          {copied ? 'Copied' : 'Copy LaTeX'}
        </button>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
        
        {/* Step 1: A Transpose */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
            A<sup className="ml-0.5">T</sup> =
          </span>
          <MatrixStatic matrix={transposeMatrix} />
        </div>

        {/* Step 2: RREF */}
        <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">RREF</span>
            <MatrixStatic matrix={transposeRrefMatrix} />
        </div>

        {/* Step 3: Result */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex flex-col text-sm font-bold text-gray-700 dark:text-gray-300">
            <span>R(A) = C(A<sup className="ml-0.5">T</sup>)</span>
          </div>

          <div className="flex items-center gap-2 text-xl font-light text-gray-400 sm:text-3xl">
            <span className="whitespace-nowrap text-sm font-bold text-gray-700 dark:text-gray-300">= span</span>
            <span aria-hidden>{'\u2329'}</span>
          </div>

          <div className="overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            <div className="flex gap-2 w-max">
              {basisVectors.map((vec, i) => (
                <VectorCard key={i} vectorString={vec} color="text-orange-600" />
              ))}
            </div>
          </div>

          <div className="flex items-center text-xl font-light text-gray-400 sm:text-3xl">
            <span aria-hidden>{'\u232A'}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
