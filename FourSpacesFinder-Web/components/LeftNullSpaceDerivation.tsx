import React, { useState } from 'react';
import { Matrix, Fraction, matrixToLatex, vectorStringToLatex } from '@/lib/math';
import { MatrixStatic } from './MatrixStatic';
import { VectorCard } from './VectorCard';
import { ArrowRight } from 'lucide-react';
import { copyToClipboard } from '@/lib/utils';

interface LeftNullSpaceDerivationProps {
  transposeRrefMatrix: Matrix;
  transposePivots: number[];
  basisVectors: string[];
}

export function LeftNullSpaceDerivation({ transposeRrefMatrix, transposePivots, basisVectors }: LeftNullSpaceDerivationProps) {
  // Logic is almost identical to NullSpaceDerivation, just different labels
  const allCols = Array.from({ length: transposeRrefMatrix.cols }, (_, i) => i);
  const pivotSet = new Set(transposePivots);
  const freeCols = allCols.filter(c => !pivotSet.has(c));
  const [copied, setCopied] = useState(false);
  
  const headers = allCols.map(i => `x${i + 1}`);
  const v = (i: number) => `x${i + 1}`;

  const buildExpressionVector = () => {
    const expressions: string[] = [];
    const pivotColToRow = new Map<number, number>();
    transposePivots.forEach((col, row) => pivotColToRow.set(col, row));

    for (let c = 0; c < transposeRrefMatrix.cols; c++) {
      if (!pivotSet.has(c)) {
        expressions.push(v(c));
      } else {
        const r = pivotColToRow.get(c)!;
        const terms: string[] = [];
        for (const freeC of freeCols) {
          const val = transposeRrefMatrix.get(r, freeC);
          if (val.equals(Fraction.zero)) continue;
          
          const coeff = val.negate();
          let term = "";
          if (coeff.equals(Fraction.one)) {
             term = `+ ${v(freeC)}`;
          } else if (coeff.equals(Fraction.one.negate())) {
             term = `- ${v(freeC)}`;
          } else {
             const s = coeff.toString();
             if (s.startsWith('-')) {
                 term = `- ${s.substring(1)}${v(freeC)}`;
             } else {
                 term = `+ ${s}${v(freeC)}`;
             }
          }
          terms.push(term);
        }

        if (terms.length === 0) {
            expressions.push("0");
        } else {
            let s = terms.join(" ");
            if (s.startsWith("+ ")) s = s.substring(2);
            else if (s.startsWith("- ")) s = "-" + s.substring(2);
            expressions.push(s);
        }
      }
    }
    return expressions;
  };

  const exprVector = buildExpressionVector();
  const exprToLatex = (expr: string) => {
    let s = expr.trim();
    s = s.replace(/(-?\d+)\/(\d+)/g, (_m, a, b) => {
      const n = parseInt(a, 10);
      if (n < 0) return `-\\frac{${Math.abs(n)}}{${b}}`;
      return `\\frac{${n}}{${b}}`;
    });
    s = s.replace(/x(\d+)/g, 'x_{$1}');
    s = s.replace(/(\d|\})x_\{/g, '$1\\,x_{');
    return s.length === 0 ? "0" : s;
  };

  return (
    <div className="w-full">
      <div className="flex justify-end mb-2">
        <button
          type="button"
          onClick={async () => {
            const exprLatex = `\\begin{bmatrix} ${exprVector.map(exprToLatex).join(' \\\\ ')} \\end{bmatrix}`;
            const decomposition =
              freeCols.length > 0
                ? freeCols
                    .map((colIdx, i) => `x_{${colIdx + 1}}\\,${vectorStringToLatex(basisVectors[i] ?? "")}`)
                    .join(' + ')
                : "";
            const vectorsLatex = basisVectors.map(vectorStringToLatex).join(', ');
            
            // Single-line format where possible
            let latex = `\\mathrm{RREF}(A^T) = ${matrixToLatex(transposeRrefMatrix)} \\quad \\implies \\quad `;
            latex += `x = ${exprLatex}`;
            if (decomposition.length > 0) {
                latex += ` = ${decomposition}`;
            }
            latex += ` \\quad \\implies \\quad N(A^T) = \\mathrm{span}\\langle ${vectorsLatex} \\rangle`;

            await copyToClipboard(latex);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
          }}
          className="px-3 py-1.5 text-[11px] font-bold bg-white/40 backdrop-blur-sm rounded-full border border-white/20 text-gray-800 hover:bg-white/50 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15"
        >
          {copied ? 'Copied' : 'Copy LaTeX'}
        </button>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
        
        {/* Step 1: RREF(At) */}
        <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">RREF (A<sup className="ml-0.5">T</sup>)</span>
            <div className="flex items-center gap-3">
            <MatrixStatic matrix={transposeRrefMatrix} headers={headers} highlightCols={pivotSet} />
            </div>
        </div>

        <ArrowRight className="w-4 h-4 text-gray-400 hidden sm:block" />

        {/* Step 2: Parametric Vector */}
        <div className="flex items-center p-3 bg-white/40 backdrop-blur-md rounded-[14px] border border-white/30 shadow-sm dark:bg-white/5 dark:border-white/10">
             <div className="flex items-stretch">
                <div className="w-2 border-l-2 border-t-2 border-b-2 border-gray-800 dark:border-gray-300 rounded-l-sm opacity-80" />
                <div className="flex flex-col gap-1 px-2 py-1">
                    {exprVector.map((ex, i) => (
                        <div key={i} className="text-center font-mono text-[13px] font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                            {ex}
                        </div>
                    ))}
                </div>
                <div className="w-2 border-r-2 border-t-2 border-b-2 border-gray-800 dark:border-gray-300 rounded-r-sm opacity-80" />
             </div>
        </div>

        {/* Step 3: Result */}
        <div className="flex flex-col gap-2 pt-3 border-t border-gray-300 dark:border-gray-700 sm:flex-row sm:items-center sm:gap-3 sm:pt-0 sm:border-t-0 sm:ml-2 sm:border-l sm:pl-4">
             <div className="flex flex-col text-sm font-bold text-gray-700 dark:text-gray-300">
                <span>N(A<sup className="ml-0.5">T</sup>) = span</span>
             </div>
             <div className="flex items-center text-xl font-light text-gray-400 sm:text-3xl">
                <span aria-hidden>{'\u2329'}</span>
            </div>
             <div className="overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
               <div className="flex gap-2 w-max">
                  {basisVectors.map((vec, i) => (
                      <VectorCard key={i} vectorString={vec} color="text-pink-600" />
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
