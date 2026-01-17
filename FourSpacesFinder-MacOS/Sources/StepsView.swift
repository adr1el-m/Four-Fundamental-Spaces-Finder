import SwiftUI
import AppKit

struct StepsView: View {
    let steps: [CalculationStep]
    let title: String
    let pivots: [Int]
    let isTranspose: Bool
    
    var body: some View {
        GlassPanel {
            VStack(alignment: .leading, spacing: 12) {
                Text(title)
                    .font(.headline)
                
                if steps.isEmpty {
                    Text("Waiting...")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                } else {
                    ScrollView(.horizontal) {
                        HStack(alignment: .top, spacing: 12) {
                            ForEach(Array(steps.enumerated()), id: \.element.id) { i, step in
                                let isFirst = i == 0
                                let isLast = i == steps.count - 1
                                let highlightPivots = isFirst || isLast
                                
                                if isLast {
                                    VStack(alignment: .leading, spacing: 8) {
                                        RrefFinalTag(isTranspose: isTranspose)
                                        StepMatrixCard(step: step, pivots: pivots, highlightPivots: highlightPivots)
                                    }
                                } else {
                                    StepMatrixCard(step: step, pivots: pivots, highlightPivots: highlightPivots)
                                }
                                
                                if i < steps.count - 1 {
                                    StepArrow(label: steps[i + 1].description)
                                }
                            }
                        }
                        .padding(.vertical, 2)
                        .padding(.horizontal, 2)
                    }
                    .scrollIndicators(.hidden)
                }
            }
        }
    }
}

private struct RrefFinalTag: View {
    let isTranspose: Bool
    
    var body: some View {
        HStack(spacing: 0) {
            if isTranspose {
                Text("RREF A")
                Text("T")
                    .font(.system(size: 9, weight: .bold))
                    .baselineOffset(6)
                    .padding(.leading, 1)
            } else {
                Text("RREF")
            }
        }
        .font(.system(size: 10, weight: .bold))
        .foregroundStyle(.primary)
        .textCase(.uppercase)
        .tracking(0.8)
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
        .background(.ultraThinMaterial)
        .clipShape(Capsule())
        .overlay(Capsule().stroke(Color.white.opacity(0.2), lineWidth: 1))
    }
}

private struct StepArrow: View {
    let label: String
    
    var body: some View {
        VStack(spacing: 6) {
            if !label.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                Text(label)
                    .font(.system(size: 11, weight: .bold))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 6)
                    .background(.ultraThinMaterial)
                    .clipShape(Capsule())
                    .overlay(Capsule().stroke(Color.white.opacity(0.2), lineWidth: 1))
            }
            
            Image(systemName: "arrow.right")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(.secondary)
                .frame(width: 40, height: 28)
                .background(.ultraThinMaterial)
                .clipShape(Capsule())
                .overlay(Capsule().stroke(Color.white.opacity(0.2), lineWidth: 1))
        }
        .frame(minWidth: 50)
    }
}

private struct StepMatrixCard: View {
    let step: CalculationStep
    let pivots: [Int]
    let highlightPivots: Bool
    
    var body: some View {
        let m = step.matrixState
        let pivotSet = Set(pivots)
        let font = NSFont.monospacedSystemFont(ofSize: 13, weight: .medium)
        let colWidths: [CGFloat] = (0..<m.cols).map { c in
            var w: CGFloat = 36
            for r in 0..<m.rows {
                let s = m.get(r, c).description
                let measured = (s as NSString).size(withAttributes: [.font: font]).width + 14
                w = max(w, ceil(measured))
            }
            return w
        }
        
        VStack(spacing: 4) {
            ForEach(0..<m.rows, id: \.self) { r in
                HStack(spacing: 8) {
                    ForEach(0..<m.cols, id: \.self) { c in
                        let val = m.get(r, c)
                        let isHighlighted = highlightPivots && pivotSet.contains(c)
                        
                        Text(val.description)
                            .font(.system(size: 13, weight: .medium, design: .monospaced))
                            .foregroundStyle(isHighlighted ? Color.blue : Color.primary)
                            .lineLimit(1)
                            .frame(width: colWidths[c], height: 24)
                            .background(
                                RoundedRectangle(cornerRadius: 6)
                                    .fill(isHighlighted ? Color.blue.opacity(0.18) : Color.clear)
                            )
                    }
                }
            }
        }
        .padding(12)
        .background(step.isPivotStep ? Color.white.opacity(0.10) : Color.white.opacity(0.05))
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .stroke(step.isPivotStep ? Color.white.opacity(0.30) : Color.white.opacity(0.20), lineWidth: 1)
        )
    }
}
