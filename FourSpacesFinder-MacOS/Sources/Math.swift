import Foundation

// MARK: - Fraction

struct Fraction: Equatable, CustomStringConvertible, Hashable {
    let numerator: Int
    let denominator: Int
    
    init(_ n: Int, _ d: Int = 1) {
        if d == 0 { fatalError("Denominator cannot be zero") }
        let common = Fraction.gcd(abs(n), abs(d))
        let sign = (n < 0) == (d < 0) ? 1 : -1
        self.numerator = (abs(n) / common) * sign
        self.denominator = abs(d) / common
    }
    
    private static func gcd(_ a: Int, _ b: Int) -> Int {
        return b == 0 ? a : gcd(b, a % b)
    }
    
    var description: String {
        return denominator == 1 ? "\(numerator)" : "\(numerator)/\(denominator)"
    }
    
    static let zero = Fraction(0)
    static let one = Fraction(1)
    
    static func parse(_ raw: String) -> Fraction? {
        let s = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        if s.isEmpty { return nil }
        
        let parts = s.components(separatedBy: "/")
        if parts.count == 1 {
            guard let n = Int(parts[0]) else { return nil }
            return Fraction(n)
        }
        
        if parts.count == 2 {
            guard let n = Int(parts[0]), let d = Int(parts[1]), d != 0 else { return nil }
            return Fraction(n, d)
        }
        
        return nil
    }
    
    func add(_ rhs: Fraction) -> Fraction {
        return Fraction(
            numerator * rhs.denominator + rhs.numerator * denominator,
            denominator * rhs.denominator
        )
    }
    
    func sub(_ rhs: Fraction) -> Fraction {
        return Fraction(
            numerator * rhs.denominator - rhs.numerator * denominator,
            denominator * rhs.denominator
        )
    }
    
    func mul(_ rhs: Fraction) -> Fraction {
        return Fraction(
            numerator * rhs.numerator,
            denominator * rhs.denominator
        )
    }
    
    func div(_ rhs: Fraction) -> Fraction {
        return Fraction(
            numerator * rhs.denominator,
            denominator * rhs.numerator
        )
    }
    
    func negate() -> Fraction {
        return Fraction(-numerator, denominator)
    }
    
    var doubleValue: Double {
        return Double(numerator) / Double(denominator)
    }
}

// MARK: - Matrix

struct CalculationStep: Identifiable {
    let id: UUID
    let matrixState: Matrix
    let description: String
    let isPivotStep: Bool
}

struct Matrix: Equatable {
    let rows: Int
    let cols: Int
    var data: [[Fraction]]
    
    init(rows: Int, cols: Int, fill: Fraction = .zero) {
        self.rows = rows
        self.cols = cols
        self.data = Array(repeating: Array(repeating: fill, count: cols), count: rows)
    }
    
    func get(_ r: Int, _ c: Int) -> Fraction {
        return data[r][c]
    }
    
    mutating func set(_ r: Int, _ c: Int, _ val: Fraction) {
        data[r][c] = val
    }
    
    func transposed() -> Matrix {
        var res = Matrix(rows: cols, cols: rows)
        for r in 0..<rows {
            for c in 0..<cols {
                res.set(c, r, self.get(r, c))
            }
        }
        return res
    }
    
    func rrefWithSteps() -> (rrefMatrix: Matrix, pivots: [Int], steps: [CalculationStep]) {
        var m = self // Value type copy
        var pivotRow = 0
        var pivotIndices: [Int] = []
        var steps: [CalculationStep] = []
        
        steps.append(CalculationStep(id: UUID(), matrixState: m, description: "", isPivotStep: false))
        
        for col in 0..<cols {
            if pivotRow >= rows { break }
            
            var pivot = pivotRow
            while pivot < rows && m.get(pivot, col) == .zero {
                pivot += 1
            }
            
            if pivot < rows {
                if pivot != pivotRow {
                    let temp = m.data[pivotRow]
                    m.data[pivotRow] = m.data[pivot]
                    m.data[pivot] = temp
                    
                    steps.append(CalculationStep(id: UUID(), matrixState: m, description: "E\(pivot + 1)\(pivotRow + 1)", isPivotStep: false))
                }
                
                let divisor = m.get(pivotRow, col)
                if divisor != .one {
                    for c in 0..<cols {
                        m.set(pivotRow, c, m.get(pivotRow, c).div(divisor))
                    }
                    steps.append(CalculationStep(id: UUID(), matrixState: m, description: "E\(pivotRow + 1)(1/\(divisor))", isPivotStep: false))
                }
                
                for r in 0..<rows {
                    if r != pivotRow {
                        let factor = m.get(r, col)
                        if factor != .zero {
                            for c in 0..<cols {
                                m.set(r, c, m.get(r, c).sub(factor.mul(m.get(pivotRow, c))))
                            }
                            steps.append(CalculationStep(id: UUID(), matrixState: m, description: "E\(r + 1)\(pivotRow + 1)(\(factor.negate()))", isPivotStep: false))
                        }
                    }
                }
                
                pivotIndices.append(col)
                pivotRow += 1
            }
        }
        
        steps.append(CalculationStep(id: UUID(), matrixState: m, description: "", isPivotStep: true))
        
        return (m, pivotIndices, steps)
    }
    
    func columnSpaceBasis(pivots: [Int]) -> [String] {
        var basis: [String] = []
        for colIndex in pivots {
            var vecStr = ""
            for r in 0..<rows {
                vecStr += "[\(self.get(r, colIndex))]\n"
            }
            basis.append(vecStr)
        }
        return basis
    }
    
    func nullSpaceBasis(rrefM: Matrix, pivots: [Int]) -> [String] {
        let pivotSet = Set(pivots)
        var basis: [String] = []
        
        for c in 0..<cols {
            if !pivotSet.contains(c) {
                var sol = Array(repeating: Fraction.zero, count: cols)
                sol[c] = .one
                
                for (rowIndex, pivotCol) in pivots.enumerated() {
                    sol[pivotCol] = rrefM.get(rowIndex, c).negate()
                }
                
                var vecStr = ""
                for val in sol {
                    vecStr += "[\(val)]\n"
                }
                basis.append(vecStr)
            }
        }
        
        if basis.isEmpty { return ["[ 0 ]\n(trivial)"] }
        return basis
    }
    
    func rowSpaceBasisFromRref(rrefM: Matrix) -> [String] {
        var basis: [String] = []
        
        for r in 0..<rrefM.rows {
            var allZero = true
            for c in 0..<rrefM.cols {
                if rrefM.get(r, c) != .zero {
                    allZero = false
                    break
                }
            }
            if allZero { continue }
            
            var vecStr = ""
            for c in 0..<rrefM.cols {
                vecStr += "[\(rrefM.get(r, c))]\n"
            }
            basis.append(vecStr)
        }
        
        if basis.isEmpty { return ["[ 0 ]\n(trivial)"] }
        return basis
    }
}

// MARK: - Helpers

func parseVectorDoubles(raw: String, dimension: Int) -> [Double] {
    let lines = raw.components(separatedBy: "\n").map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }
    var values: [String] = []
    
    for line in lines {
        if line.hasPrefix("(") { continue }
        if line.hasPrefix("[") && line.hasSuffix("]") {
            let inner = String(line.dropFirst().dropLast()).trimmingCharacters(in: .whitespacesAndNewlines)
            if !inner.isEmpty { values.append(inner) }
            continue
        }
        if !line.isEmpty { values.append(line) }
    }
    
    var doubles = values.map { parseScalarToDouble($0) ?? 0 }
    if doubles.isEmpty { doubles = [0] }
    
    if doubles.count < dimension {
        doubles += Array(repeating: 0.0, count: dimension - doubles.count)
    } else if doubles.count > dimension {
        doubles = Array(doubles.prefix(dimension))
    }
    return doubles
}

func fractionToLatex(_ f: Fraction) -> String {
    if f.denominator == 1 { return "\(f.numerator)" }
    if f.numerator < 0 { return "-\\frac{\(abs(f.numerator))}{\(f.denominator)}" }
    return "\\frac{\(f.numerator)}{\(f.denominator)}"
}

func matrixToLatex(_ matrix: Matrix) -> String {
    let rows = (0..<matrix.rows).map { r in
        (0..<matrix.cols).map { c in
            fractionToLatex(matrix.get(r, c))
        }.joined(separator: " & ")
    }.joined(separator: " \\\\ ")
    return "\\begin{bmatrix} \(rows) \\end{bmatrix}"
}

private func scalarStringToLatex(_ raw: String) -> String {
    let s = raw.trimmingCharacters(in: .whitespacesAndNewlines)
    let parts = s.split(separator: "/").map(String.init)
    if parts.count == 2, let n = Int(parts[0]), let d = Int(parts[1]), d != 0 {
        if n < 0 { return "-\\frac{\(abs(n))}{\(d)}" }
        return "\\frac{\(n)}{\(d)}"
    }
    return s.isEmpty ? "0" : s
}

func vectorStringToLatex(_ vectorString: String) -> String {
    let lines = vectorString
        .components(separatedBy: "\n")
        .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
        .filter { !$0.isEmpty }
    
    var values: [String] = []
    for line in lines {
        if line.hasPrefix("(") { continue }
        if line.hasPrefix("[") && line.hasSuffix("]") {
            let inner = String(line.dropFirst().dropLast()).trimmingCharacters(in: .whitespacesAndNewlines)
            if !inner.isEmpty { values.append(inner) }
            continue
        }
        values.append(line)
    }
    
    if values.isEmpty { values.append("0") }
    let body = values.map(scalarStringToLatex).joined(separator: " \\\\ ")
    return "\\begin{bmatrix} \(body) \\end{bmatrix}"
}

func parseScalarToDouble(_ raw: String) -> Double? {
    let s = raw.trimmingCharacters(in: .whitespacesAndNewlines)
    if s.isEmpty { return nil }
    let parts = s.components(separatedBy: "/")
    if parts.count == 2 {
        guard let n = Double(parts[0]), let d = Double(parts[1]), d != 0 else { return nil }
        return n / d
    }
    return Double(s)
}

func isZeroVector(_ v: [Double], eps: Double = 1e-9) -> Bool {
    let len = sqrt(v.reduce(0) { $0 + $1 * $1 })
    return len < eps
}

func cross2(_ a: [Double], _ b: [Double]) -> Double {
    return (a.count > 1 && b.count > 1) ? (a[0] * b[1] - a[1] * b[0]) : 0
}
