import React from 'react';
import { GlassPanel } from './ui/GlassPanel';
import { SubspacePlot2D } from './SubspacePlot2D';
import { SubspacePlot3D } from './SubspacePlot3D';
import { parseVectorDoubles } from '@/lib/math';
import { cn } from '@/lib/utils';

export type GeometricSpaceChoice = 'C(A)' | 'R(A)' | 'N(A)' | 'N(Aᵗ)';

interface GeometricSectionProps {
  selection: GeometricSpaceChoice;
  setSelection: (s: GeometricSpaceChoice) => void;
  rows: number;
  cols: number;
  colSpace: string[];
  rowSpace: string[];
  nullSpace: string[];
  leftNullSpace: string[];
}

export function GeometricSection({ 
    selection, setSelection, rows, cols, 
    colSpace, rowSpace, nullSpace, leftNullSpace 
}: GeometricSectionProps) {

    const choices: GeometricSpaceChoice[] = ['C(A)', 'R(A)', 'N(A)', 'N(Aᵗ)'];
    
    const getAmbientDimension = (s: GeometricSpaceChoice) => {
        switch (s) {
            case 'C(A)': case 'N(Aᵗ)': return rows;
            case 'R(A)': case 'N(A)': return cols;
        }
    };

    const getBasis = (s: GeometricSpaceChoice) => {
        switch (s) {
            case 'C(A)': return colSpace;
            case 'R(A)': return rowSpace;
            case 'N(A)': return nullSpace;
            case 'N(Aᵗ)': return leftNullSpace;
        }
    };

    const getAccentColor = (s: GeometricSpaceChoice) => {
        switch (s) {
            case 'C(A)': return 'rgb(34, 197, 94)'; // green
            case 'R(A)': return 'rgb(249, 115, 22)'; // orange
            case 'N(A)': return 'rgb(59, 130, 246)'; // blue
            case 'N(Aᵗ)': return 'rgb(236, 72, 153)'; // pink
        }
    };

    const ambient = getAmbientDimension(selection);
    const rawBasis = getBasis(selection);

    return (
        <GlassPanel>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">Geometric Visualization</h3>
            </div>

            <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded-lg mb-4">
                {choices.map(choice => (
                    <button
                        key={choice}
                        onClick={() => setSelection(choice)}
                        className={cn(
                            "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all",
                            selection === choice 
                                ? "bg-white dark:bg-white/20 shadow-sm text-gray-900 dark:text-white" 
                                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        )}
                    >
                        {choice}
                    </button>
                ))}
            </div>

            <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>Ambient space: ℝ{ambient}</span>
                {rawBasis.length > 0 && <span>Basis vectors: {rawBasis.length}</span>}
            </div>

            {rawBasis.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] bg-white/5 rounded-xl border border-white/10">
                    <span className="text-gray-400 text-sm">Waiting...</span>
                </div>
            ) : ambient === 2 ? (
                <SubspacePlot2D 
                    basisVectors={rawBasis.map(v => parseVectorDoubles(v, 2))} 
                    accentColor={getAccentColor(selection)}
                />
            ) : ambient === 3 ? (
                <SubspacePlot3D
                    basisVectors={rawBasis.map(v => parseVectorDoubles(v, 3))}
                    accentColor={getAccentColor(selection)}
                />
            ) : (
                <div className="flex items-center justify-center h-[300px] bg-white/5 rounded-xl border border-white/10 p-6 text-center">
                    <span className="text-gray-400 text-sm">
                        Graph available when the subspace is in ℝ². <br/>
                        Current ambient dimension is ℝ{ambient}.
                    </span>
                </div>
            )}
        </GlassPanel>
    );
}
