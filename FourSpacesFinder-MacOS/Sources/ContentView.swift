import AppKit
import SwiftUI

struct ContentView: View {
    @State private var rows = 2
    @State private var cols = 3
    @State private var inputs: [String] = Array(repeating: "0", count: 25)
    @State private var showAbout = false
    
    // Results
    @State private var rrefMatrix: Matrix?
    @State private var colSpace: [String] = []
    @State private var rowSpace: [String] = []
    @State private var nullSpace: [String] = []
    @State private var leftNullSpace: [String] = []
    @State private var colSpaceExpl: String = ""
    @State private var rowSpaceExpl: String = ""
    @State private var nullSpaceExpl: String = ""
    @State private var leftNullSpaceExpl: String = ""
    @State private var transposeMatrix: Matrix?
    @State private var transposeRrefMatrix: Matrix?
    
    // Steps
    @State private var steps: [CalculationStep] = []
    @State private var pivots: [Int] = []
    @State private var transposeSteps: [CalculationStep] = []
    @State private var transposePivots: [Int] = []
    
    // UI State
    @State private var selectedSpace: SpaceType = .column
    @AppStorage("appTheme") private var currentTheme: AppTheme = .system
    
    enum AppTheme: String, CaseIterable, Identifiable {
        case system = "System"
        case light = "Light"
        case dark = "Dark"
        var id: String { rawValue }
    }
    
    enum SpaceType: String, CaseIterable, Identifiable {
        case column = "C(A)"
        case row = "R(A)"
        case null = "N(A)"
        case leftNull = "N(Aᵗ)"
        var id: String { rawValue }
        
        var color: Color {
            switch self {
            case .column: return .green
            case .row: return .orange
            case .null: return .blue
            case .leftNull: return .pink
            }
        }
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header
                HStack {
                    VStack(alignment: .leading) {
                        Text("Four Fundamental Spaces Finder")
                            .font(.title)
                            .bold()
                        Text("Native macOS Version")
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    
                    Picker("", selection: $currentTheme) {
                        ForEach(AppTheme.allCases) { theme in
                            Text(theme.rawValue).tag(theme)
                        }
                    }
                    .pickerStyle(.menu)
                    .frame(width: 100)
                    .padding(.trailing, 8)
                    
                    GlassButton(title: "About", icon: "info.circle") {
                        showAbout = true
                    }
                }
                
                // Controls
                HStack(alignment: .top, spacing: 20) {
                    GlassPanel {
                        VStack(spacing: 20) {
                            HStack {
                                Text("Rows")
                                Spacer()
                                Picker("", selection: $rows) {
                                    ForEach(1...5, id: \.self) { Text("\($0)") }
                                }
                                .pickerStyle(.segmented)
                                .frame(width: 150)
                            }
                            
                            HStack {
                                Text("Cols")
                                Spacer()
                                Picker("", selection: $cols) {
                                    ForEach(1...5, id: \.self) { Text("\($0)") }
                                }
                                .pickerStyle(.segmented)
                                .frame(width: 150)
                            }
                            
                            HStack {
                                GlassButton(title: "Calculate", icon: "bolt.fill") {
                                    calculate()
                                }
                                GlassButton(title: "Reset", icon: "arrow.counterclockwise", action: {
                                    reset()
                                }, variant: .secondary)
                            }
                        }
                        .padding()
                    }
                    .frame(width: 300)
                    
                    GlassPanel {
                        VStack {
                            Text("Matrix Input")
                                .font(.headline)
                            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: cols), spacing: 10) {
                                ForEach(0..<(rows * cols), id: \.self) { idx in
                                    TextField("0", text: $inputs[idx])
                                        .textFieldStyle(.roundedBorder)
                                        .multilineTextAlignment(.center)
                                        .frame(height: 40)
                                }
                            }
                            .frame(maxWidth: CGFloat(cols * 70))
                        }
                        .padding()
                    }
                }
                
                if !steps.isEmpty {
                    VStack(spacing: 20) {
                        StepsView(steps: steps, title: "RREF Process (A)", pivots: pivots, isTranspose: false)
                        if !transposeSteps.isEmpty {
                            StepsView(steps: transposeSteps, title: "RREF Process (Aᵗ)", pivots: transposePivots, isTranspose: true)
                        }
                    }
                    
                    // Results
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 20) {
                        SpaceSection(
                            title: "Column Space C(A)",
                            color: .green,
                            explanation: colSpaceExpl,
                            latexBuilder: buildColumnSpaceLatex
                        ) {
                            if colSpace.isEmpty {
                                Text("Waiting...")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            } else {
                                SpanVectorsView(vectors: colSpace, color: .green)
                            }
                        }
                        
                        SpaceSection(
                            title: "Row Space R(A)",
                            color: .orange,
                            explanation: rowSpaceExpl,
                            latexBuilder: buildRowSpaceLatex
                        ) {
                            if let tm = transposeMatrix, let tr = transposeRrefMatrix {
                                RowSpaceDerivationView(transposeMatrix: tm, transposeRrefMatrix: tr, basisVectors: rowSpace)
                            } else {
                                Text("Waiting...")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        
                        SpaceSection(
                            title: "Null Space N(A)",
                            color: .blue,
                            explanation: nullSpaceExpl,
                            latexBuilder: buildNullSpaceLatex
                        ) {
                            if let rref = rrefMatrix {
                                NullSpaceDerivationView(rrefMatrix: rref, pivots: pivots, basisVectors: nullSpace, accentColor: .blue, spaceLabel: "N(A)")
                            } else {
                                Text("Waiting...")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        
                        SpaceSection(
                            title: "Left Null Space N(Aᵗ)",
                            color: .pink,
                            explanation: leftNullSpaceExpl,
                            latexBuilder: buildLeftNullSpaceLatex
                        ) {
                            if let tr = transposeRrefMatrix {
                                NullSpaceDerivationView(rrefMatrix: tr, pivots: transposePivots, basisVectors: leftNullSpace, accentColor: .pink, spaceLabel: "N(Aᵗ)")
                            } else {
                                Text("Waiting...")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    
                    // Geometric Visualization
                    VStack(spacing: 12) {
                        Picker("Space", selection: $selectedSpace) {
                            ForEach(SpaceType.allCases) { type in
                                Text(type.rawValue).tag(type)
                            }
                        }
                        .pickerStyle(.segmented)
                        .frame(width: 400)
                        
                        let vecs = vectorsForSelection(selectedSpace)
                        GeometryView(basisVectors: vecs, accentColor: selectedSpace.color)
                    }
                }
                
                Spacer()
            }
            .padding()
        }
        .background(
            LinearGradient(colors: [Color.gray.opacity(0.1), Color.gray.opacity(0.2)], startPoint: .topLeading, endPoint: .bottomTrailing)
        )
        .onAppear {
            calculate()
        }
        .sheet(isPresented: $showAbout) {
            AboutView()
                .frame(minWidth: 720, minHeight: 560)
        }
        .preferredColorScheme(currentTheme == .light ? .light : (currentTheme == .dark ? .dark : nil))
    }
    
    func vectorsForSelection(_ type: SpaceType) -> [String] {
        switch type {
        case .column: return colSpace
        case .row: return rowSpace
        case .null: return nullSpace
        case .leftNull: return leftNullSpace
        }
    }
    
    func calculate() {
        var m = Matrix(rows: rows, cols: cols)
        for r in 0..<rows {
            for c in 0..<cols {
                let idx = r * 5 + c
                let valStr = inputs[idx]
                if let f = Fraction.parse(valStr) {
                    m.set(r, c, f)
                }
            }
        }
        
        let res = m.rrefWithSteps()
        self.rrefMatrix = res.rrefMatrix
        self.pivots = res.pivots
        self.steps = res.steps
        self.colSpace = m.columnSpaceBasis(pivots: res.pivots)
        self.nullSpace = m.nullSpaceBasis(rrefM: res.rrefMatrix, pivots: res.pivots)
        
        let mT = m.transposed()
        let resT = mT.rrefWithSteps()
        self.transposeSteps = resT.steps
        self.transposePivots = resT.pivots
        self.transposeMatrix = mT
        self.transposeRrefMatrix = resT.rrefMatrix
        
        let swiftRowSpace = mT.columnSpaceBasis(pivots: resT.pivots)
        let rowSpaceFallback = m.rowSpaceBasisFromRref(rrefM: res.rrefMatrix)
        self.rowSpace = !swiftRowSpace.isEmpty ? swiftRowSpace : rowSpaceFallback
        self.leftNullSpace = mT.nullSpaceBasis(rrefM: resT.rrefMatrix, pivots: resT.pivots)
        
        colSpaceExpl = colSpaceExplanation(pivots: res.pivots)
        rowSpaceExpl = rowSpaceExplanation(transposePivots: resT.pivots)
        nullSpaceExpl = nullSpaceExplanation(numCols: cols, pivots: res.pivots)
        leftNullSpaceExpl = leftNullSpaceExplanation(numRows: rows, transposePivots: resT.pivots)
    }
    
    func reset() {
        inputs = Array(repeating: "0", count: 25)
        colSpace = []
        rowSpace = []
        nullSpace = []
        leftNullSpace = []
        colSpaceExpl = ""
        rowSpaceExpl = ""
        nullSpaceExpl = ""
        leftNullSpaceExpl = ""
        steps = []
        pivots = []
        transposeSteps = []
        transposePivots = []
        rrefMatrix = nil
        transposeMatrix = nil
        transposeRrefMatrix = nil
    }
    
    func colsList(_ indices: [Int]) -> String {
        indices.map { "\($0 + 1)" }.joined(separator: ", ")
    }
    
    func colSpaceExplanation(pivots: [Int]) -> String {
        if pivots.isEmpty {
            return "The RREF has no pivot columns, so the column space C(A) only contains the zero vector."
        }
        if pivots.count == 1 {
            return "The RREF has a pivot in column \(pivots[0] + 1), so column \(pivots[0] + 1) of the original matrix is a basis for the column space C(A)."
        }
        return "The pivot columns in the RREF are columns \(colsList(pivots)), so those same columns from the original matrix form a basis for the column space C(A)."
    }
    
    func rowSpaceExplanation(transposePivots: [Int]) -> String {
        if transposePivots.isEmpty {
            return "The RREF of Aᵗ has no pivot columns, so the row space R(A) only contains the zero vector."
        }
        if transposePivots.count == 1 {
            return "The RREF of Aᵗ has a pivot in column \(transposePivots[0] + 1), so row \(transposePivots[0] + 1) of the original matrix is a basis vector for the row space R(A)."
        }
        return "The pivot columns in the RREF of Aᵗ are columns \(colsList(transposePivots)), so the corresponding rows of the original matrix form a basis for the row space R(A)."
    }
    
    func nullSpaceExplanation(numCols: Int, pivots: [Int]) -> String {
        let pivotSet = Set(pivots)
        let freeCols = (0..<numCols).filter { !pivotSet.contains($0) }
        if freeCols.isEmpty {
            return "All columns are pivot columns, so there are no free variables and the null space N(A) is trivial (only the zero vector)."
        }
        if freeCols.count == 1 {
            return "Column \(freeCols[0] + 1) is a free variable, so the null space N(A) has one basis vector found by setting that free variable to 1 and the others to 0."
        }
        return "Columns \(colsList(freeCols)) are free variables, so the null space N(A) basis vectors are found by setting one free variable to 1 (others 0) and solving for the pivot variables."
    }
    
    func leftNullSpaceExplanation(numRows: Int, transposePivots: [Int]) -> String {
        let pivotSet = Set(transposePivots)
        let freeCols = (0..<numRows).filter { !pivotSet.contains($0) }
        if freeCols.isEmpty {
            return "All columns of Aᵗ are pivot columns, so there are no free variables and the left null space N(Aᵗ) is trivial (only the zero vector)."
        }
        if freeCols.count == 1 {
            return "Column \(freeCols[0] + 1) of Aᵗ is a free variable, so the left null space N(Aᵗ) has one basis vector found by setting that free variable to 1 and the others to 0."
        }
        return "Columns \(colsList(freeCols)) of Aᵗ are free variables, so the left null space N(Aᵗ) basis vectors are found by setting one free variable to 1 (others 0) and solving for the pivot variables."
    }
    
    func buildColumnSpaceLatex() -> String {
        let vectorsLatex = colSpace.map(vectorStringToLatex).joined(separator: ", ")
        return "\\begin{aligned}\n\\text{Column Space } &= \\mathrm{span}\\langle \(vectorsLatex) \\rangle\n\\end{aligned}"
    }
    
    func buildRowSpaceLatex() -> String {
        guard let tm = transposeMatrix, let tr = transposeRrefMatrix else { return "" }
        let vectorsLatex = rowSpace.map(vectorStringToLatex).joined(separator: ", ")
        var latex = "A^T = \(matrixToLatex(tm)) \\quad \\implies \\quad "
        latex += "\\mathrm{rref}(A^T) = \(matrixToLatex(tr)) \\quad \\implies \\quad "
        latex += "R(A) = \\mathrm{span}\\langle \(vectorsLatex) \\rangle"
        return latex
    }
    
    func buildNullSpaceLatex() -> String {
        guard let rref = rrefMatrix else { return "" }
        let (exprVector, freeCols) = buildExpressionVector(rrefMatrix: rref, pivots: pivots)
        let exprLatex = "\\begin{bmatrix} \(exprVector.map(exprToLatex).joined(separator: " \\\\ ")) \\end{bmatrix}"
        let decomposition = freeCols.isEmpty ? "" : freeCols.enumerated().map { i, colIdx in
            "x_{\(colIdx + 1)}\\,\(vectorStringToLatex(nullSpace[safe: i] ?? ""))"
        }.joined(separator: " + ")
        let vectorsLatex = nullSpace.map(vectorStringToLatex).joined(separator: ", ")
        
        var latex = "\\mathrm{RREF}(A) = \(matrixToLatex(rref)) \\quad \\implies \\quad "
        latex += "x = \(exprLatex)"
        if !decomposition.isEmpty { latex += " = \(decomposition)" }
        latex += " \\quad \\implies \\quad N(A) = \\mathrm{span}\\langle \(vectorsLatex) \\rangle"
        return latex
    }
    
    func buildLeftNullSpaceLatex() -> String {
        guard let tr = transposeRrefMatrix else { return "" }
        let (exprVector, freeCols) = buildExpressionVector(rrefMatrix: tr, pivots: transposePivots)
        let exprLatex = "\\begin{bmatrix} \(exprVector.map(exprToLatex).joined(separator: " \\\\ ")) \\end{bmatrix}"
        let decomposition = freeCols.isEmpty ? "" : freeCols.enumerated().map { i, colIdx in
            "x_{\(colIdx + 1)}\\,\(vectorStringToLatex(leftNullSpace[safe: i] ?? ""))"
        }.joined(separator: " + ")
        let vectorsLatex = leftNullSpace.map(vectorStringToLatex).joined(separator: ", ")
        
        var latex = "\\mathrm{RREF}(A^T) = \(matrixToLatex(tr)) \\quad \\implies \\quad "
        latex += "x = \(exprLatex)"
        if !decomposition.isEmpty { latex += " = \(decomposition)" }
        latex += " \\quad \\implies \\quad N(A^T) = \\mathrm{span}\\langle \(vectorsLatex) \\rangle"
        return latex
    }
    
    func buildExpressionVector(rrefMatrix: Matrix, pivots: [Int]) -> (expressions: [String], freeCols: [Int]) {
        let pivotSet = Set(pivots)
        let allCols = Array(0..<rrefMatrix.cols)
        let freeCols = allCols.filter { !pivotSet.contains($0) }
        
        var pivotColToRow: [Int: Int] = [:]
        for (row, col) in pivots.enumerated() {
            pivotColToRow[col] = row
        }
        
        func v(_ i: Int) -> String { "x\(i + 1)" }
        
        var expressions: [String] = []
        for c in 0..<rrefMatrix.cols {
            if !pivotSet.contains(c) {
                expressions.append(v(c))
                continue
            }
            
            let r = pivotColToRow[c] ?? 0
            var terms: [String] = []
            for freeC in freeCols {
                let val = rrefMatrix.get(r, freeC)
                if val == .zero { continue }
                let coeff = val.negate()
                
                if coeff == .one {
                    terms.append("+ \(v(freeC))")
                } else if coeff == Fraction(-1) {
                    terms.append("- \(v(freeC))")
                } else {
                    let s = coeff.description
                    if s.hasPrefix("-") {
                        terms.append("- \(String(s.dropFirst()))\(v(freeC))")
                    } else {
                        terms.append("+ \(s)\(v(freeC))")
                    }
                }
            }
            
            if terms.isEmpty {
                expressions.append("0")
            } else {
                var s = terms.joined(separator: " ")
                if s.hasPrefix("+ ") {
                    s = String(s.dropFirst(2))
                } else if s.hasPrefix("- ") {
                    s = "-" + String(s.dropFirst(2))
                }
                expressions.append(s)
            }
        }
        
        return (expressions, freeCols)
    }
    
    func exprToLatex(_ expr: String) -> String {
        var s = expr.trimmingCharacters(in: .whitespacesAndNewlines)
        
        let fractionRegex = try? NSRegularExpression(pattern: "(-?\\d+)/(\\d+)")
        if let fractionRegex {
            let range = NSRange(s.startIndex..<s.endIndex, in: s)
            s = fractionRegex.stringByReplacingMatches(in: s, range: range, withTemplate: "\\\\frac{$1}{$2}")
            s = s.replacingOccurrences(of: "\\frac{-", with: "-\\frac{")
        }
        
        let varRegex = try? NSRegularExpression(pattern: "x(\\d+)")
        if let varRegex {
            let range = NSRange(s.startIndex..<s.endIndex, in: s)
            s = varRegex.stringByReplacingMatches(in: s, range: range, withTemplate: "x_{$1}")
        }
        
        let mulRegex = try? NSRegularExpression(pattern: "(\\d|\\})x_\\{")
        if let mulRegex {
            let range = NSRange(s.startIndex..<s.endIndex, in: s)
            s = mulRegex.stringByReplacingMatches(in: s, range: range, withTemplate: "$1\\\\,x_{")
        }
        
        return s.isEmpty ? "0" : s
    }
}

struct SpaceSection: View {
    let title: String
    let color: Color
    let explanation: String?
    let latexBuilder: (() -> String)?
    let content: AnyView
    
    @State private var copied = false
    
    init(title: String, color: Color, explanation: String? = nil, latexBuilder: (() -> String)? = nil, @ViewBuilder content: () -> some View) {
        self.title = title
        self.color = color
        self.explanation = explanation
        self.latexBuilder = latexBuilder
        self.content = AnyView(content())
    }
    
    var body: some View {
        GlassPanel {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    HStack(spacing: 8) {
                        Circle().fill(color).frame(width: 8, height: 8)
                        Text(title)
                            .font(.system(size: 15, weight: .semibold))
                    }
                    Spacer()
                    if latexBuilder != nil {
                        Button {
                            guard let latexBuilder else { return }
                            let latex = latexBuilder()
                            if latex.isEmpty { return }
                            copyToClipboard(latex)
                            copied = true
                            DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                                copied = false
                            }
                        } label: {
                            Text(copied ? "Copied" : "Copy LaTeX")
                                .font(.system(size: 11, weight: .bold))
                                .padding(.horizontal, 12)
                                .padding(.vertical, 7)
                                .background(.ultraThinMaterial)
                                .clipShape(Capsule())
                                .overlay(Capsule().stroke(Color.white.opacity(0.2), lineWidth: 1))
                        }
                        .buttonStyle(.plain)
                    }
                }
                
                if let explanation, !explanation.isEmpty {
                    Text(explanation)
                        .font(.system(size: 12, weight: .regular))
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
                
                content
            }
        }
    }
}

struct VectorView: View {
    let vectorString: String
    let color: Color
    
    var values: [String] {
        vectorString.components(separatedBy: "\n")
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { $0.hasPrefix("[") }
            .map { $0.replacingOccurrences(of: "[", with: "").replacingOccurrences(of: "]", with: "") }
    }

    var bracketHeight: CGFloat {
        let rowCount = max(1, values.count)
        let font = NSFont.monospacedSystemFont(ofSize: 15, weight: .medium)
        let lineHeight = font.ascender - font.descender + font.leading
        let rowSpacing: CGFloat = 6
        let verticalPadding: CGFloat = 16
        return CGFloat(rowCount) * lineHeight + CGFloat(max(0, rowCount - 1)) * rowSpacing + verticalPadding
    }
    
    var body: some View {
        HStack(spacing: 0) {
            BracketSide(isLeft: true, height: bracketHeight)
            VStack(spacing: 6) {
                ForEach(values, id: \.self) { val in
                    Text(val)
                        .font(.system(size: 15, weight: .medium, design: .monospaced))
                        .foregroundStyle(color)
                        .frame(minWidth: 20)
                        .multilineTextAlignment(.center)
                        .lineLimit(1)
                }
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 8)
            BracketSide(isLeft: false, height: bracketHeight)
        }
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        guard index >= 0, index < count else { return nil }
        return self[index]
    }
}

struct MatrixStaticView: View {
    let matrix: Matrix
    let headers: [String]?
    let highlightCols: Set<Int>?
    
    var body: some View {
        VStack(spacing: 4) {
            if let headers {
                HStack(spacing: 12) {
                    ForEach(Array(headers.enumerated()), id: \.offset) { _, h in
                        Text(h)
                            .font(.system(size: 10, weight: .bold, design: .monospaced))
                            .foregroundStyle(.secondary)
                            .frame(minWidth: 24)
                    }
                }
            }
            
            HStack(spacing: 0) {
                BracketSide(isLeft: true)
                
                VStack(spacing: 6) {
                    ForEach(0..<matrix.rows, id: \.self) { r in
                        HStack(spacing: 12) {
                            ForEach(0..<matrix.cols, id: \.self) { c in
                                let val = matrix.get(r, c)
                                let isHighlighted = highlightCols?.contains(c) ?? false
                                Text(val.description)
                                    .font(.system(size: 13, weight: .medium, design: .monospaced))
                                    .foregroundStyle(isHighlighted ? Color.blue : Color.primary)
                                    .frame(minWidth: 24, minHeight: 24)
                                    .padding(.horizontal, 4)
                                    .background(isHighlighted ? Color.blue.opacity(0.12) : Color.clear)
                                    .clipShape(RoundedRectangle(cornerRadius: 5, style: .continuous))
                            }
                        }
                    }
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 8)
                
                BracketSide(isLeft: false)
            }
        }
    }
}

private struct BracketSide: View {
    let isLeft: Bool
    var height: CGFloat? = nil
    
    var body: some View {
        SquareBracketSide(isLeft: isLeft)
            .stroke(Color.primary.opacity(0.75), style: StrokeStyle(lineWidth: 2, lineCap: .square, lineJoin: .miter))
            .frame(width: 8, height: height)
    }
}

private struct SquareBracketSide: Shape {
    let isLeft: Bool
    
    func path(in rect: CGRect) -> Path {
        var p = Path()
        let tick = min(rect.width, 8)
        
        if isLeft {
            let x = rect.minX
            p.move(to: CGPoint(x: x + tick, y: rect.minY))
            p.addLine(to: CGPoint(x: x, y: rect.minY))
            p.addLine(to: CGPoint(x: x, y: rect.maxY))
            p.addLine(to: CGPoint(x: x + tick, y: rect.maxY))
        } else {
            let x = rect.maxX
            p.move(to: CGPoint(x: x - tick, y: rect.minY))
            p.addLine(to: CGPoint(x: x, y: rect.minY))
            p.addLine(to: CGPoint(x: x, y: rect.maxY))
            p.addLine(to: CGPoint(x: x - tick, y: rect.maxY))
        }
        
        return p
    }
}

private struct AngleBracketSide: Shape {
    let isLeft: Bool
    
    func path(in rect: CGRect) -> Path {
        var p = Path()
        if isLeft {
            p.move(to: CGPoint(x: rect.minX, y: rect.midY))
            p.addLine(to: CGPoint(x: rect.maxX, y: rect.minY))
            p.move(to: CGPoint(x: rect.minX, y: rect.midY))
            p.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
        } else {
            p.move(to: CGPoint(x: rect.maxX, y: rect.midY))
            p.addLine(to: CGPoint(x: rect.minX, y: rect.minY))
            p.move(to: CGPoint(x: rect.maxX, y: rect.midY))
            p.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
        }
        return p
    }
}

private struct SpanVectorsView: View {
    let vectors: [String]
    let color: Color

    var bracketHeight: CGFloat {
        let maxRows = vectors
            .map { v in
                v.components(separatedBy: "\n")
                    .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
                    .filter { $0.hasPrefix("[") && $0.hasSuffix("]") }
                    .count
            }
            .max() ?? 1

        let font = NSFont.monospacedSystemFont(ofSize: 15, weight: .medium)
        let rowHeight = font.ascender - font.descender + font.leading
        let rowSpacing: CGFloat = 6
        let verticalPadding: CGFloat = 16

        let h = CGFloat(maxRows) * rowHeight + CGFloat(max(0, maxRows - 1)) * rowSpacing + verticalPadding
        return max(44, h)
    }
    
    var body: some View {
        ScrollView(.horizontal) {
            HStack(alignment: .center, spacing: 10) {
                AngleBracketSide(isLeft: true)
                    .stroke(Color.secondary, style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round))
                    .frame(width: 12, height: bracketHeight)
                
                ForEach(vectors, id: \.self) { vec in
                    VectorView(vectorString: vec, color: color)
                }
                
                AngleBracketSide(isLeft: false)
                    .stroke(Color.secondary, style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round))
                    .frame(width: 12, height: bracketHeight)
            }
            .padding(.bottom, 2)
        }
        .scrollIndicators(.hidden)
    }
}

struct RowSpaceDerivationView: View {
    let transposeMatrix: Matrix
    let transposeRrefMatrix: Matrix
    let basisVectors: [String]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 14) {
                HStack(spacing: 8) {
                    Text("A")
                        .font(.system(size: 14, weight: .bold))
                    Text("T")
                        .font(.system(size: 11, weight: .bold))
                        .baselineOffset(7)
                        .padding(.leading, -4)
                    Text("=")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(.secondary)
                    MatrixStaticView(matrix: transposeMatrix, headers: nil, highlightCols: nil)
                }
                
                VStack(alignment: .center, spacing: 8) {
                    Text("RREF")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(.secondary)
                        .textCase(.uppercase)
                        .tracking(0.8)
                    MatrixStaticView(matrix: transposeRrefMatrix, headers: nil, highlightCols: nil)
                }
            }
            
            HStack(alignment: .center, spacing: 10) {
                HStack(spacing: 0) {
                    Text("R(A) = C(A")
                        .font(.system(size: 14, weight: .bold))
                    Text("T")
                        .font(.system(size: 11, weight: .bold))
                        .baselineOffset(7)
                        .padding(.leading, 1)
                    Text(")")
                        .font(.system(size: 14, weight: .bold))
                }
                
                Text("= span")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(.secondary)
                SpanVectorsView(vectors: basisVectors, color: .orange)
            }
        }
    }
}

struct NullSpaceDerivationView: View {
    let rrefMatrix: Matrix
    let pivots: [Int]
    let basisVectors: [String]
    let accentColor: Color
    let spaceLabel: String
    
    var body: some View {
        let pivotSet = Set(pivots)
        let allCols = Array(0..<rrefMatrix.cols)
        let freeCols = allCols.filter { !pivotSet.contains($0) }
        let headers = allCols.map { "x\($0 + 1)" }
        let exprVector = buildExpressionVector(freeCols: freeCols)
        
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 12) {
                HStack(spacing: 8) {
                    Text("RREF =")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(.secondary)
                    MatrixStaticView(matrix: rrefMatrix, headers: headers, highlightCols: pivotSet)
                }
                
                Image(systemName: "arrow.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.secondary)
                    .padding(.top, 18)
                
                ParametricVectorView(expressions: exprVector)
                    .padding(.top, 6)
            }
            
            if !freeCols.isEmpty {
                HStack(alignment: .center, spacing: 10) {
                    Text("=")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundStyle(.secondary)
                    
                    ScrollView(.horizontal) {
                        HStack(spacing: 12) {
                            ForEach(Array(freeCols.enumerated()), id: \.element) { i, colIdx in
                                if i > 0 {
                                    Text("+")
                                        .font(.system(size: 20, weight: .bold))
                                        .foregroundStyle(.secondary)
                                }
                                HStack(spacing: 8) {
                                    Text("x\(colIdx + 1)")
                                        .font(.system(size: 14, weight: .bold, design: .monospaced))
                                        .foregroundStyle(accentColor)
                                    VectorView(vectorString: basisVectors[safe: i] ?? "[ 0 ]\n(trivial)", color: accentColor)
                                }
                            }
                        }
                        .padding(.bottom, 2)
                    }
                }
            }
            
            Divider()
                .background(Color.white.opacity(0.15))
            
            HStack(alignment: .center, spacing: 10) {
                Text("\(spaceLabel) = span")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(.secondary)
                SpanVectorsView(vectors: basisVectors, color: accentColor)
            }
        }
    }
    
    func buildExpressionVector(freeCols: [Int]) -> [String] {
        var pivotColToRow: [Int: Int] = [:]
        for (row, col) in pivots.enumerated() {
            pivotColToRow[col] = row
        }
        let pivotSet = Set(pivots)
        
        func v(_ i: Int) -> String { "x\(i + 1)" }
        
        var expressions: [String] = []
        for c in 0..<rrefMatrix.cols {
            if !pivotSet.contains(c) {
                expressions.append(v(c))
                continue
            }
            
            let r = pivotColToRow[c] ?? 0
            var terms: [String] = []
            for freeC in freeCols {
                let val = rrefMatrix.get(r, freeC)
                if val == .zero { continue }
                let coeff = val.negate()
                
                if coeff == .one {
                    terms.append("+ \(v(freeC))")
                } else if coeff == Fraction(-1) {
                    terms.append("- \(v(freeC))")
                } else {
                    let s = coeff.description
                    if s.hasPrefix("-") {
                        terms.append("- \(String(s.dropFirst()))\(v(freeC))")
                    } else {
                        terms.append("+ \(s)\(v(freeC))")
                    }
                }
            }
            
            if terms.isEmpty {
                expressions.append("0")
            } else {
                var s = terms.joined(separator: " ")
                if s.hasPrefix("+ ") {
                    s = String(s.dropFirst(2))
                } else if s.hasPrefix("- ") {
                    s = "-" + String(s.dropFirst(2))
                }
                expressions.append(s)
            }
        }
        return expressions
    }
}

struct ParametricVectorView: View {
    let expressions: [String]

    var bracketHeight: CGFloat {
        let rowCount = max(1, expressions.count)
        let font = NSFont.monospacedSystemFont(ofSize: 13, weight: .medium)
        let lineHeight = font.ascender - font.descender + font.leading
        let rowSpacing: CGFloat = 6
        let verticalPadding: CGFloat = 16
        return CGFloat(rowCount) * lineHeight + CGFloat(max(0, rowCount - 1)) * rowSpacing + verticalPadding
    }
    
    var body: some View {
        HStack(spacing: 0) {
            BracketSide(isLeft: true, height: bracketHeight)
            VStack(spacing: 6) {
                ForEach(Array(expressions.enumerated()), id: \.offset) { _, ex in
                    Text(ex)
                        .font(.system(size: 13, weight: .medium, design: .monospaced))
                        .foregroundStyle(.primary)
                        .lineLimit(1)
                }
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 8)
            BracketSide(isLeft: false, height: bracketHeight)
        }
    }
}
