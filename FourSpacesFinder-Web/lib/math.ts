import { v4 as uuidv4 } from 'uuid';

// MARK: - Fraction

export class Fraction {
  numerator: number;
  denominator: number;

  constructor(n: number, d: number = 1) {
    if (d === 0) throw new Error("Denominator cannot be zero");
    const common = this.gcd(Math.abs(n), Math.abs(d));
    const sign = (n < 0) === (d < 0) ? 1 : -1;
    this.numerator = (Math.abs(n) / common) * sign;
    this.denominator = Math.abs(d) / common;
  }

  private gcd(a: number, b: number): number {
    return b === 0 ? a : this.gcd(b, a % b);
  }

  toString(): string {
    return this.denominator === 1 ? `${this.numerator}` : `${this.numerator}/${this.denominator}`;
  }

  static zero = new Fraction(0);
  static one = new Fraction(1);
  
  static parse(raw: string): Fraction | null {
    const s = raw.trim();
    if (s.length === 0) return null;
    
    const parts = s.split('/');
    if (parts.length === 1) {
      const n = parseInt(parts[0], 10);
      if (Number.isNaN(n)) return null;
      return new Fraction(n);
    }
    
    if (parts.length === 2) {
      const n = parseInt(parts[0], 10);
      const d = parseInt(parts[1], 10);
      if (Number.isNaN(n) || Number.isNaN(d) || d === 0) return null;
      return new Fraction(n, d);
    }
    
    return null;
  }

  add(rhs: Fraction): Fraction {
    return new Fraction(
      this.numerator * rhs.denominator + rhs.numerator * this.denominator,
      this.denominator * rhs.denominator
    );
  }

  sub(rhs: Fraction): Fraction {
    return new Fraction(
      this.numerator * rhs.denominator - rhs.numerator * this.denominator,
      this.denominator * rhs.denominator
    );
  }

  mul(rhs: Fraction): Fraction {
    return new Fraction(
      this.numerator * rhs.numerator,
      this.denominator * rhs.denominator
    );
  }

  div(rhs: Fraction): Fraction {
    return new Fraction(
      this.numerator * rhs.denominator,
      this.denominator * rhs.numerator
    );
  }

  negate(): Fraction {
    return new Fraction(-this.numerator, this.denominator);
  }

  equals(rhs: Fraction): boolean {
    return this.numerator === rhs.numerator && this.denominator === rhs.denominator;
  }

  toNumber(): number {
    return this.numerator / this.denominator;
  }
}

// MARK: - Matrix

export interface CalculationStep {
  id: string;
  matrixState: Matrix; // We'll store a copy
  description: string;
  isPivotStep: boolean;
}

export class Matrix {
  rows: number;
  cols: number;
  data: Fraction[][];

  constructor(rows: number, cols: number, fill: Fraction = Fraction.zero) {
    this.rows = rows;
    this.cols = cols;
    this.data = Array(rows).fill(null).map(() => Array(cols).fill(fill));
  }

  clone(): Matrix {
    const m = new Matrix(this.rows, this.cols);
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        m.data[r][c] = this.data[r][c];
      }
    }
    return m;
  }

  get(r: number, c: number): Fraction {
    return this.data[r][c];
  }

  set(r: number, c: number, val: Fraction) {
    this.data[r][c] = val;
  }

  transposed(): Matrix {
    const res = new Matrix(this.cols, this.rows);
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        res.set(c, r, this.get(r, c));
      }
    }
    return res;
  }

  rrefWithSteps(): { rrefMatrix: Matrix; pivots: number[]; steps: CalculationStep[] } {
    const m = this.clone();
    let pivotRow = 0;
    const pivotIndices: number[] = [];
    const steps: CalculationStep[] = [];

    steps.push({
      id: uuidv4(),
      matrixState: m.clone(),
      description: "",
      isPivotStep: false,
    });

    for (let col = 0; col < this.cols; col++) {
      if (pivotRow >= this.rows) break;

      let pivot = pivotRow;
      while (pivot < this.rows && m.get(pivot, col).equals(Fraction.zero)) {
        pivot++;
      }

      if (pivot < this.rows) {
        if (pivot !== pivotRow) {
          // Swap rows
          const temp = m.data[pivotRow];
          m.data[pivotRow] = m.data[pivot];
          m.data[pivot] = temp;

          steps.push({
            id: uuidv4(),
            matrixState: m.clone(),
            description: `E${pivot + 1}${pivotRow + 1}`,
            isPivotStep: false,
          });
        }

        const divisor = m.get(pivotRow, col);
        if (!divisor.equals(Fraction.one)) {
          for (let c = 0; c < this.cols; c++) {
            m.set(pivotRow, c, m.get(pivotRow, c).div(divisor));
          }
          steps.push({
            id: uuidv4(),
            matrixState: m.clone(),
            description: `E${pivotRow + 1}(1/${divisor})`,
            isPivotStep: false,
          });
        }

        for (let r = 0; r < this.rows; r++) {
          if (r !== pivotRow) {
            const factor = m.get(r, col);
            if (!factor.equals(Fraction.zero)) {
              for (let c = 0; c < this.cols; c++) {
                // m[r, c] = m[r, c] - (factor * m[pivotRow, c])
                m.set(r, c, m.get(r, c).sub(factor.mul(m.get(pivotRow, c))));
              }
              steps.push({
                id: uuidv4(),
                matrixState: m.clone(),
                description: `E${r + 1}${pivotRow + 1}(${factor.negate()})`,
                isPivotStep: false,
              });
            }
          }
        }

        pivotIndices.push(col);
        pivotRow++;
      }
    }

    steps.push({
      id: uuidv4(),
      matrixState: m.clone(),
      description: "",
      isPivotStep: true,
    });

    return { rrefMatrix: m, pivots: pivotIndices, steps };
  }

  columnSpaceBasis(pivots: number[]): string[] {
    const basis: string[] = [];
    for (const colIndex of pivots) {
      let vecStr = "";
      for (let r = 0; r < this.rows; r++) {
        vecStr += `[${this.get(r, colIndex).toString()}]\n`;
      }
      basis.push(vecStr);
    }
    return basis;
  }

  nullSpaceBasis(rrefM: Matrix, pivots: number[]): string[] {
    const pivotSet = new Set(pivots);
    const basis: string[] = [];

    for (let c = 0; c < this.cols; c++) {
      if (!pivotSet.has(c)) {
        const sol = Array(this.cols).fill(Fraction.zero);
        sol[c] = Fraction.one;

        // The pivots array gives us (rowIndex, pivotCol) pairs essentially
        // pivots[i] is the column index of the pivot in row i
        for (let rowIndex = 0; rowIndex < pivots.length; rowIndex++) {
          const pivotCol = pivots[rowIndex];
          // sol[pivotCol] = -(rrefM[rowIndex, c])
          sol[pivotCol] = rrefM.get(rowIndex, c).negate();
        }

        let vecStr = "";
        for (const val of sol) {
          vecStr += `[${val.toString()}]\n`;
        }
        basis.push(vecStr);
      }
    }

    if (basis.length === 0) return ["[ 0 ]\n(trivial)"];
    return basis;
  }

  rowSpaceBasisFromRref(rrefM: Matrix): string[] {
    const basis: string[] = [];

    for (let r = 0; r < rrefM.rows; r++) {
      let allZero = true;
      for (let c = 0; c < rrefM.cols; c++) {
        if (!rrefM.get(r, c).equals(Fraction.zero)) {
          allZero = false;
          break;
        }
      }
      if (allZero) continue;

      let vecStr = "";
      for (let c = 0; c < rrefM.cols; c++) {
        vecStr += `[${rrefM.get(r, c).toString()}]\n`;
      }
      basis.push(vecStr);
    }

    if (basis.length === 0) return ["[ 0 ]\n(trivial)"];
    return basis;
  }
}

// MARK: - Helpers

function scalarStringToLatex(raw: string): string {
  const s = raw.trim();
  const m = s.match(/^(-?\d+)\/(\d+)$/);
  if (m) {
    const n = parseInt(m[1], 10);
    const d = m[2];
    if (n < 0) return `-\\frac{${Math.abs(n)}}{${d}}`;
    return `\\frac{${n}}{${d}}`;
  }
  return s.length === 0 ? "0" : s;
}

export function fractionToLatex(f: Fraction): string {
  if (f.denominator === 1) return `${f.numerator}`;
  if (f.numerator < 0) return `-\\frac{${Math.abs(f.numerator)}}{${f.denominator}}`;
  return `\\frac{${f.numerator}}{${f.denominator}}`;
}

export function matrixToLatex(matrix: Matrix): string {
  const rows = matrix.data.map(row => row.map(fractionToLatex).join(' & ')).join(' \\\\ ');
  return `\\begin{bmatrix} ${rows} \\end{bmatrix}`;
}

export function vectorStringToLatex(vectorString: string): string {
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
    if (line.length > 0) values.push(line);
  }

  if (values.length === 0) values.push("0");
  const body = values.map(scalarStringToLatex).join(' \\\\ ');
  return `\\begin{bmatrix} ${body} \\end{bmatrix}`;
}

export function parseVectorDoubles(raw: string, dimension: number): number[] {
  const lines = raw.split('\n').map(s => s.trim()).filter(s => s.length > 0);
  const values: string[] = [];
  
  for (const line of lines) {
    if (line.startsWith('(')) continue;
    if (line.startsWith('[') && line.endsWith(']')) {
      const inner = line.slice(1, -1).trim();
      if (inner.length > 0) values.push(inner);
      continue;
    }
    if (line.length > 0) values.push(line);
  }
  
  let doubles = values.map(s => parseScalarToDouble(s) ?? 0);
  if (doubles.length === 0) doubles = [0];
  
  if (doubles.length < dimension) {
    doubles = [...doubles, ...Array(dimension - doubles.length).fill(0)];
  } else if (doubles.length > dimension) {
    doubles = doubles.slice(0, dimension);
  }
  return doubles;
}

function parseScalarToDouble(raw: string): number | null {
  const s = raw.trim();
  if (s.length === 0) return null;
  const parts = s.split('/');
  if (parts.length === 2) {
    const n = parseFloat(parts[0]);
    const d = parseFloat(parts[1]);
    if (!isNaN(n) && !isNaN(d) && d !== 0) {
      return n / d;
    }
  }
  const val = parseFloat(s);
  return isNaN(val) ? null : val;
}

export function isZeroVector(v: number[], eps: number = 1e-9): boolean {
  const len = Math.sqrt(v.reduce((acc, val) => acc + val * val, 0));
  return len < eps;
}

export function cross2(a: number[], b: number[]): number {
    return (a.length > 1 && b.length > 1) ? (a[0] * b[1] - a[1] * b[0]) : 0;
}
