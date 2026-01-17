'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Fraction, Matrix, CalculationStep } from '@/lib/math';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GlassButton } from '@/components/ui/GlassButton';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { MatrixInput } from '@/components/MatrixInput';
import { RrefSection } from '@/components/RrefSection';
import { SpaceSection } from '@/components/SpaceSection';
import { GeometricSection, GeometricSpaceChoice } from '@/components/GeometricSection';
import { RowSpaceDerivation } from '@/components/RowSpaceDerivation';
import { NullSpaceDerivation } from '@/components/NullSpaceDerivation';
import { LeftNullSpaceDerivation } from '@/components/LeftNullSpaceDerivation';
import { Bolt, RotateCcw } from 'lucide-react';

function colsList(indices: number[]) {
  return indices.map(i => i + 1).join(", ");
}

function colSpaceExplanation(pivots: number[]) {
  if (pivots.length === 0) {
    return "The RREF has no pivot columns, so the column space C(A) only contains the zero vector.";
  }
  if (pivots.length === 1) {
    return `The RREF has a pivot in column ${pivots[0] + 1}, so column ${pivots[0] + 1} of the original matrix is a basis for the column space C(A).`;
  }
  return `The pivot columns in the RREF are columns ${colsList(pivots)}, so those same columns from the original matrix form a basis for the column space C(A).`;
}

function rowSpaceExplanation(transposePivots: number[]) {
  if (transposePivots.length === 0) {
    return "The RREF of Aᵗ has no pivot columns, so the row space R(A) only contains the zero vector.";
  }
  if (transposePivots.length === 1) {
    return `The RREF of Aᵗ has a pivot in column ${transposePivots[0] + 1}, so row ${transposePivots[0] + 1} of the original matrix is a basis vector for the row space R(A).`;
  }
  return `The pivot columns in the RREF of Aᵗ are columns ${colsList(transposePivots)}, so the corresponding rows of the original matrix form a basis for the row space R(A).`;
}

function nullSpaceExplanation(numCols: number, pivots: number[]) {
  const pivotSet = new Set(pivots);
  const freeCols = Array.from({ length: numCols }, (_, i) => i).filter(i => !pivotSet.has(i));

  if (freeCols.length === 0) {
    return "All columns are pivot columns, so there are no free variables and the null space N(A) is trivial (only the zero vector).";
  }
  if (freeCols.length === 1) {
    return `Column ${freeCols[0] + 1} is a free variable, so the null space N(A) has one basis vector found by setting that free variable to 1 and the others to 0.`;
  }
  return `Columns ${colsList(freeCols)} are free variables, so the null space N(A) basis vectors are found by setting one free variable to 1 (others 0) and solving for the pivot variables.`;
}

function leftNullSpaceExplanation(numRows: number, transposePivots: number[]) {
  const pivotSet = new Set(transposePivots);
  const freeCols = Array.from({ length: numRows }, (_, i) => i).filter(i => !pivotSet.has(i));

  if (freeCols.length === 0) {
    return "All columns of Aᵗ are pivot columns, so there are no free variables and the left null space N(Aᵗ) is trivial (only the zero vector).";
  }
  if (freeCols.length === 1) {
    return `Column ${freeCols[0] + 1} of Aᵗ is a free variable, so the left null space N(Aᵗ) has one basis vector found by setting that free variable to 1 and the others to 0.`;
  }
  return `Columns ${colsList(freeCols)} of Aᵗ are free variables, so the left null space N(Aᵗ) basis vectors are found by setting one free variable to 1 (others 0) and solving for the pivot variables.`;
}

const DEFAULT_INPUTS = Array(25).fill("");
const INITIAL_ROWS = 1;
const INITIAL_COLS = 1;

export default function Home() {
  const router = useRouter();
  const [rows, setRows] = useState(INITIAL_ROWS);
  const [cols, setCols] = useState(INITIAL_COLS);
  const [inputs, setInputs] = useState<string[]>(DEFAULT_INPUTS);
  const [hasCalculated, setHasCalculated] = useState(false);
  
  // Results
  const [steps, setSteps] = useState<CalculationStep[]>([]);
  const [pivots, setPivots] = useState<number[]>([]);
  const [rrefMatrix, setRrefMatrix] = useState<Matrix | null>(null);
  
  const [transposeSteps, setTransposeSteps] = useState<CalculationStep[]>([]);
  const [transposePivots, setTransposePivots] = useState<number[]>([]);
  const [transposeMatrix, setTransposeMatrix] = useState<Matrix | null>(null);
  const [transposeRrefMatrix, setTransposeRrefMatrix] = useState<Matrix | null>(null);

  const [colSpace, setColSpace] = useState<string[]>([]);
  const [rowSpace, setRowSpace] = useState<string[]>([]);
  const [nullSpace, setNullSpace] = useState<string[]>([]);
  const [leftNullSpace, setLeftNullSpace] = useState<string[]>([]);
  const [colSpaceExpl, setColSpaceExpl] = useState("");
  const [rowSpaceExpl, setRowSpaceExpl] = useState("");
  const [nullSpaceExpl, setNullSpaceExpl] = useState("");
  const [leftNullSpaceExpl, setLeftNullSpaceExpl] = useState("");

  const [geoSelection, setGeoSelection] = useState<GeometricSpaceChoice>('C(A)');
  
  const gridValues = useMemo(() => {
    const dense: string[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        dense.push(inputs[r * 5 + c] ?? "");
      }
    }
    return dense;
  }, [inputs, rows, cols]);

  const clearResults = () => {
    setHasCalculated(false);
    setSteps([]);
    setPivots([]);
    setRrefMatrix(null);
    setTransposeSteps([]);
    setTransposePivots([]);
    setTransposeMatrix(null);
    setTransposeRrefMatrix(null);
    setColSpace([]);
    setRowSpace([]);
    setNullSpace([]);
    setLeftNullSpace([]);
    setColSpaceExpl("");
    setRowSpaceExpl("");
    setNullSpaceExpl("");
    setLeftNullSpaceExpl("");
  };

  const handleCalculate = () => {
    const m = new Matrix(rows, cols);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * 5 + c;
        const valStr = inputs[idx] ?? "";
        const f = Fraction.parse(valStr);
        m.set(r, c, f ?? Fraction.zero);
      }
    }

    const { rrefMatrix: rref, pivots: p, steps: s } = m.rrefWithSteps();
    const cs = m.columnSpaceBasis(p);
    const ns = m.nullSpaceBasis(rref, p);

    setSteps(s);
    setPivots(p);
    setRrefMatrix(rref);
    setColSpace(cs);
    setNullSpace(ns);
    setNullSpaceExpl(nullSpaceExplanation(cols, p));

    try {
      const mT = m.transposed();
      const { rrefMatrix: rrefT, pivots: pT, steps: sT } = mT.rrefWithSteps();
      const swiftRowSpace = mT.columnSpaceBasis(pT);
      const rowSpaceFallback = m.rowSpaceBasisFromRref(rref);
      const rs = swiftRowSpace.length > 0 ? swiftRowSpace : rowSpaceFallback;
      const lns = mT.nullSpaceBasis(rrefT, pT);

      setTransposeSteps(sT);
      setTransposePivots(pT);
      setTransposeMatrix(mT);
      setTransposeRrefMatrix(rrefT);
      setRowSpace(rs);
      setLeftNullSpace(lns);
      setRowSpaceExpl(rowSpaceExplanation(pT));
      setLeftNullSpaceExpl(leftNullSpaceExplanation(rows, pT));
    } catch {
      setTransposeSteps([]);
      setTransposePivots([]);
      setTransposeMatrix(null);
      setTransposeRrefMatrix(null);
      setRowSpace(m.rowSpaceBasisFromRref(rref));
      setLeftNullSpace(["[ 0 ]\n(trivial)"]);
      setRowSpaceExpl("The row space R(A) is taken from the nonzero rows of RREF(A).");
      setLeftNullSpaceExpl("The left null space N(Aᵗ) could not be computed for this input.");
    }
    
    // Explanation
    setColSpaceExpl(colSpaceExplanation(p));
    setHasCalculated(true);
  };

  const handleReset = () => {
    setRows(INITIAL_ROWS);
    setCols(INITIAL_COLS);
    setInputs(Array(25).fill(""));
    clearResults();
  };

  const handleInputChange = (index: number, val: string) => {
    if (!/^-?\d*(\/\d*)?$/.test(val)) return;
    const newInputs = [...inputs];
    newInputs[index] = val;
    setInputs(newInputs);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-black p-4 md:p-8 font-sans">
      <div className="w-full max-w-[95%] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Four Fundamental Spaces finder</h1>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Fundamental Spaces Visualizer</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <GlassButton variant="secondary" onClick={() => router.push('/about')}>
              About
            </GlassButton>
          </div>
        </div>

        {/* Controls & Input */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassPanel className="flex flex-col justify-between">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Rows</label>
                        <div className="flex bg-gray-200 dark:bg-white/10 rounded-lg p-1">
                            {[1,2,3,4,5].map(r => (
                                <button 
                                    key={r}
                                    onClick={() => {
                                      setRows(r);
                                      clearResults();
                                    }}
                                    className={`w-8 h-7 text-xs font-semibold rounded-md transition-all ${rows === r ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Cols</label>
                        <div className="flex bg-gray-200 dark:bg-white/10 rounded-lg p-1">
                            {[1,2,3,4,5].map(c => (
                                <button 
                                    key={c}
                                    onClick={() => {
                                      setCols(c);
                                      clearResults();
                                    }}
                                    className={`w-8 h-7 text-xs font-semibold rounded-md transition-all ${cols === c ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <GlassButton onClick={handleCalculate} className="flex-1 justify-center">
                        <Bolt className="w-4 h-4" />
                        Calculate
                    </GlassButton>
                    <GlassButton onClick={handleReset} variant="secondary" className="flex-1 justify-center">
                        <RotateCcw className="w-4 h-4" />
                        Reset
                    </GlassButton>
                </div>
            </GlassPanel>

            <GlassPanel>
                <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Matrix Input</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Type integers. Updates apply on calculate.</p>
                </div>
                <div className="flex justify-center">
                    <MatrixInput 
                        rows={rows} 
                        cols={cols} 
                        values={gridValues} 
                        onChange={(i, v) => {
                            const r = Math.floor(i / cols);
                            const c = i % cols;
                            const storageIdx = r * 5 + c;
                            handleInputChange(storageIdx, v);
                        }} 
                    />
                </div>
            </GlassPanel>
        </div>

        {/* Steps */}
        {hasCalculated && (steps.length > 0 || transposeSteps.length > 0) && (
            <div className="space-y-6">
                <RrefSection title="RREF Process (A)" steps={steps} pivots={pivots} isTranspose={false} />
                <RrefSection title="RREF Process (Aᵗ)" steps={transposeSteps} pivots={transposePivots} isTranspose={true} />
            </div>
        )}

        {/* Spaces */}
        {hasCalculated && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
                <SpaceSection 
                    title="Column Space C(A)" 
                    vectors={colSpace} 
                    explanation={colSpaceExpl}
                    color="text-green-600"
                />
                <SpaceSection 
                    title="Row Space R(A)" 
                    vectors={rowSpace}
                    explanation={rowSpaceExpl}
                    color="text-orange-600"
                >
                    {transposeMatrix && transposeRrefMatrix && rowSpace.length > 0 && (
                        <RowSpaceDerivation 
                            transposeMatrix={transposeMatrix}
                            transposeRrefMatrix={transposeRrefMatrix}
                            basisVectors={rowSpace}
                        />
                    )}
                </SpaceSection>
            </div>
            <div className="space-y-6">
                <SpaceSection 
                    title="Null Space N(A)" 
                    vectors={nullSpace}
                    explanation={nullSpaceExpl}
                    color="text-blue-600"
                >
                    {rrefMatrix && nullSpace.length > 0 && (
                        <NullSpaceDerivation 
                            rrefMatrix={rrefMatrix}
                            pivots={pivots}
                            basisVectors={nullSpace}
                        />
                    )}
                </SpaceSection>
                <SpaceSection 
                    title="Left Null Space N(Aᵗ)" 
                    vectors={leftNullSpace}
                    explanation={leftNullSpaceExpl}
                    color="text-pink-600"
                >
                    {transposeRrefMatrix && leftNullSpace.length > 0 && (
                        <LeftNullSpaceDerivation 
                            transposeRrefMatrix={transposeRrefMatrix}
                            transposePivots={transposePivots}
                            basisVectors={leftNullSpace}
                        />
                    )}
                </SpaceSection>
            </div>
        </div>
        )}

        {hasCalculated && (
          <GeometricSection 
              selection={geoSelection}
              setSelection={setGeoSelection}
              rows={rows}
              cols={cols}
              colSpace={colSpace}
              rowSpace={rowSpace}
              nullSpace={nullSpace}
              leftNullSpace={leftNullSpace}
          />
        )}

      </div>
    </main>
  );
}
