import SwiftUI
import AppKit

struct GeometryView: View {
    let basisVectors: [String]
    let accentColor: Color

    @State private var rotation = (rx: -0.55, ry: 0.75, rz: 0.0)
    @State private var zoom: Double = 1.0
    @State private var lastDragTranslation: CGSize = .zero
    @State private var zoomStart: Double? = nil

    @State private var showBox = true
    @State private var showCoordPlanes = false
    @State private var showTicks = true

    var body: some View {
        GlassPanel {
            VStack(spacing: 12) {
                HStack {
                    Text("Geometric Visualization")
                        .font(.headline)
                    Spacer()
                    Button("Reset View") {
                        withAnimation {
                            rotation = (-0.55, 0.75, 0.0)
                            zoom = 1.0
                        }
                    }
                    .font(.caption)
                    .buttonStyle(.plain)
                    .padding(4)
                    .background(Color.white.opacity(0.1))
                    .cornerRadius(4)
                }

                ZStack {
                    Canvas { context, size in
                        let w = size.width
                        let h = size.height
                        let cx = w / 2
                        let cy = h / 2

                        let rawVectors = basisVectors.map { parseVectorDoubles(raw: $0, dimension: 3) }
                        let vecs = rawVectors.map { Vec3(x: $0[0], y: $0[1], z: $0[2]) }

                        let nonZero = vecs.filter { $0.length > 1e-9 }
                        let maxAbsRaw = nonZero.flatMap { [$0.x, $0.y, $0.z] }.map(abs).max() ?? 0.0
                        let maxAbs = max(1.0, maxAbsRaw)

                        let units = min(9, max(4, Int(ceil(maxAbs * 1.4))))
                        let axesLen = max(maxAbs * 1.2, Double(units) * 0.9)

                        let baseScale = min(w, h) * 0.35 / Double(units)
                        let scalePx = baseScale * zoom

                        let xAxisColor = Color(red: 1.0, green: 0.2588, blue: 0.4196)
                        let yAxisColor = Color(red: 0.2196, green: 1.0, blue: 0.4196)
                        let zAxisColor = Color(red: 0.4706, green: 0.6275, blue: 1.0)

                        func rotate(_ v: Vec3) -> Vec3 {
                            v.applyRotation(rx: rotation.rx, ry: rotation.ry, rz: rotation.rz)
                        }

                        func project(_ v: Vec3) -> CGPoint {
                            let vr = rotate(v)
                            return CGPoint(x: cx + vr.x * scalePx, y: cy - vr.y * scalePx)
                        }

                        func depth(_ v: Vec3) -> Double {
                            rotate(v).z
                        }

                        struct Line {
                            let a: Vec3
                            let b: Vec3
                            let color: Color
                            let width: CGFloat
                            let alpha: Double
                        }

                        struct ArrowHead {
                            let from: Vec3
                            let to: Vec3
                            let color: Color
                            let size: CGFloat
                            let alpha: Double
                        }

                        struct Dot {
                            let at: Vec3
                            let color: Color
                            let radius: CGFloat
                            let alpha: Double
                        }

                        struct Label {
                            let at: Vec3
                            let text: String
                            let color: Color
                            let font: Font
                            let alpha: Double
                            let offset: CGSize
                            let anchor: UnitPoint
                        }

                        var lines: [Line] = []
                        var arrowHeads: [ArrowHead] = []
                        var dots: [Dot] = []
                        var labels: [Label] = []

                        func addLine(_ a: Vec3, _ b: Vec3, color: Color, width: CGFloat, alpha: Double) {
                            lines.append(Line(a: a, b: b, color: color, width: width, alpha: alpha))
                        }

                        func addArrow(_ a: Vec3, _ b: Vec3, color: Color, width: CGFloat, headSize: CGFloat, alpha: Double) {
                            addLine(a, b, color: color, width: width, alpha: alpha)
                            let dir = (b - a).normalized
                            let tail = b - dir * (Double(headSize) / scalePx * 1.1)
                            arrowHeads.append(ArrowHead(from: tail, to: b, color: color, size: headSize, alpha: alpha))
                        }

                        func formatScalar(_ x: Double) -> String {
                            if abs(x - round(x)) < 1e-6 { return String(Int(round(x))) }
                            return String(format: "%.2f", x)
                        }

                        if showCoordPlanes {
                            let planeGridStep = units <= 6 ? 1 : 2
                            let gridAlpha = 0.10
                            let borderAlpha = 0.18

                            func drawPlane(kind: String) {
                                let u = Double(units)
                                if kind == "xy" {
                                    for i in stride(from: -units, through: units, by: planeGridStep) {
                                        let t = Double(i)
                                        addLine(Vec3(x: -u, y: t, z: 0), Vec3(x: u, y: t, z: 0), color: .white, width: 1, alpha: gridAlpha)
                                        addLine(Vec3(x: t, y: -u, z: 0), Vec3(x: t, y: u, z: 0), color: .white, width: 1, alpha: gridAlpha)
                                    }
                                    addLine(Vec3(x: -u, y: -u, z: 0), Vec3(x: u, y: -u, z: 0), color: .white, width: 1.5, alpha: borderAlpha)
                                    addLine(Vec3(x: u, y: -u, z: 0), Vec3(x: u, y: u, z: 0), color: .white, width: 1.5, alpha: borderAlpha)
                                    addLine(Vec3(x: u, y: u, z: 0), Vec3(x: -u, y: u, z: 0), color: .white, width: 1.5, alpha: borderAlpha)
                                    addLine(Vec3(x: -u, y: u, z: 0), Vec3(x: -u, y: -u, z: 0), color: .white, width: 1.5, alpha: borderAlpha)
                                } else if kind == "xz" {
                                    for i in stride(from: -units, through: units, by: planeGridStep) {
                                        let t = Double(i)
                                        addLine(Vec3(x: -u, y: 0, z: t), Vec3(x: u, y: 0, z: t), color: .white, width: 1, alpha: gridAlpha)
                                        addLine(Vec3(x: t, y: 0, z: -u), Vec3(x: t, y: 0, z: u), color: .white, width: 1, alpha: gridAlpha)
                                    }
                                    addLine(Vec3(x: -u, y: 0, z: -u), Vec3(x: u, y: 0, z: -u), color: .white, width: 1.5, alpha: borderAlpha)
                                    addLine(Vec3(x: u, y: 0, z: -u), Vec3(x: u, y: 0, z: u), color: .white, width: 1.5, alpha: borderAlpha)
                                    addLine(Vec3(x: u, y: 0, z: u), Vec3(x: -u, y: 0, z: u), color: .white, width: 1.5, alpha: borderAlpha)
                                    addLine(Vec3(x: -u, y: 0, z: u), Vec3(x: -u, y: 0, z: -u), color: .white, width: 1.5, alpha: borderAlpha)
                                } else {
                                    for i in stride(from: -units, through: units, by: planeGridStep) {
                                        let t = Double(i)
                                        addLine(Vec3(x: 0, y: -u, z: t), Vec3(x: 0, y: u, z: t), color: .white, width: 1, alpha: gridAlpha)
                                        addLine(Vec3(x: 0, y: t, z: -u), Vec3(x: 0, y: t, z: u), color: .white, width: 1, alpha: gridAlpha)
                                    }
                                    addLine(Vec3(x: 0, y: -u, z: -u), Vec3(x: 0, y: u, z: -u), color: .white, width: 1.5, alpha: borderAlpha)
                                    addLine(Vec3(x: 0, y: u, z: -u), Vec3(x: 0, y: u, z: u), color: .white, width: 1.5, alpha: borderAlpha)
                                    addLine(Vec3(x: 0, y: u, z: u), Vec3(x: 0, y: -u, z: u), color: .white, width: 1.5, alpha: borderAlpha)
                                    addLine(Vec3(x: 0, y: -u, z: u), Vec3(x: 0, y: -u, z: -u), color: .white, width: 1.5, alpha: borderAlpha)
                                }
                            }

                            drawPlane(kind: "xy")
                            drawPlane(kind: "xz")
                            drawPlane(kind: "yz")
                        }

                        if showBox {
                            let u = Double(units)
                            let borderAlpha = 0.22
                            let faintAlpha = 0.06

                            let a = Vec3(x: -u, y: -u, z: -u)
                            let b = Vec3(x: u, y: -u, z: -u)
                            let c = Vec3(x: u, y: u, z: -u)
                            let d = Vec3(x: -u, y: u, z: -u)
                            let e = Vec3(x: -u, y: -u, z: u)
                            let f = Vec3(x: u, y: -u, z: u)
                            let g = Vec3(x: u, y: u, z: u)
                            let h0 = Vec3(x: -u, y: u, z: u)

                            let edges: [(Vec3, Vec3)] = [
                                (a, b), (b, c), (c, d), (d, a),
                                (e, f), (f, g), (g, h0), (h0, e),
                                (a, e), (b, f), (c, g), (d, h0)
                            ]

                            for (p1, p2) in edges {
                                addLine(p1, p2, color: .white, width: 1.5, alpha: borderAlpha)
                            }

                            let boxStep = units <= 6 ? 1 : 2
                            for t in stride(from: -units, through: units, by: boxStep) {
                                let tt = Double(t)
                                addLine(Vec3(x: -u, y: tt, z: -u), Vec3(x: u, y: tt, z: -u), color: .white, width: 1, alpha: faintAlpha)
                                addLine(Vec3(x: tt, y: -u, z: -u), Vec3(x: tt, y: u, z: -u), color: .white, width: 1, alpha: faintAlpha)

                                addLine(Vec3(x: -u, y: tt, z: u), Vec3(x: u, y: tt, z: u), color: .white, width: 1, alpha: faintAlpha)
                                addLine(Vec3(x: tt, y: -u, z: u), Vec3(x: tt, y: u, z: u), color: .white, width: 1, alpha: faintAlpha)

                                addLine(Vec3(x: -u, y: -u, z: tt), Vec3(x: u, y: -u, z: tt), color: .white, width: 1, alpha: faintAlpha)
                                addLine(Vec3(x: tt, y: -u, z: -u), Vec3(x: tt, y: -u, z: u), color: .white, width: 1, alpha: faintAlpha)
                            }
                        }

                        // Draw spanned plane if exactly 2 vectors
                        if nonZero.count == 2 {
                            let v1 = nonZero[0]
                            let v2 = nonZero[1]
                            let cross = v1.cross(v2)
                            if cross.length > 1e-6 {
                                // Calculate orthonormal basis for the plane
                                let b1 = v1.normalized
                                let b2 = cross.cross(b1).normalized
                                
                                let u = Double(units)
                                // Draw the filled plane
                                let p1 = b1 * (-u) + b2 * (-u)
                                let p2 = b1 * (u) + b2 * (-u)
                                let p3 = b1 * (u) + b2 * (u)
                                let p4 = b1 * (-u) + b2 * (u)
                                
                                var planePath = Path()
                                planePath.move(to: project(p1))
                                planePath.addLine(to: project(p2))
                                planePath.addLine(to: project(p3))
                                planePath.addLine(to: project(p4))
                                planePath.closeSubpath()
                                
                                context.fill(planePath, with: .color(Color.blue.opacity(0.15)))
                                context.stroke(planePath, with: .color(Color.blue.opacity(0.3)), lineWidth: 1)
                                
                                // Draw grid on the plane
                                let planeGridStep = units <= 6 ? 1 : 2
                                let gridAlpha = 0.1
                                
                                for i in stride(from: -units, through: units, by: planeGridStep) {
                                    let t = Double(i)
                                    // Lines parallel to b1
                                    let start1 = b1 * (-u) + b2 * t
                                    let end1 = b1 * (u) + b2 * t
                                    addLine(start1, end1, color: .white, width: 1, alpha: gridAlpha)
                                    
                                    // Lines parallel to b2
                                    let start2 = b1 * t + b2 * (-u)
                                    let end2 = b1 * t + b2 * (u)
                                    addLine(start2, end2, color: .white, width: 1, alpha: gridAlpha)
                                }
                            }
                        }

                        addArrow(Vec3(x: -axesLen, y: 0, z: 0), Vec3(x: axesLen, y: 0, z: 0), color: xAxisColor, width: 2.2, headSize: 10, alpha: 0.92)
                        addArrow(Vec3(x: 0, y: -axesLen, z: 0), Vec3(x: 0, y: axesLen, z: 0), color: yAxisColor, width: 2.2, headSize: 10, alpha: 0.90)
                        addArrow(Vec3(x: 0, y: 0, z: -axesLen), Vec3(x: 0, y: 0, z: axesLen), color: zAxisColor, width: 2.2, headSize: 10, alpha: 0.90)

                        labels.append(Label(at: Vec3(x: axesLen, y: 0, z: 0), text: "x", color: xAxisColor, font: .system(size: 12, weight: .bold, design: .monospaced), alpha: 0.92, offset: CGSize(width: 10, height: 0), anchor: .leading))
                        labels.append(Label(at: Vec3(x: 0, y: axesLen, z: 0), text: "y", color: yAxisColor, font: .system(size: 12, weight: .bold, design: .monospaced), alpha: 0.90, offset: CGSize(width: 10, height: 0), anchor: .leading))
                        labels.append(Label(at: Vec3(x: 0, y: 0, z: axesLen), text: "z", color: zAxisColor, font: .system(size: 12, weight: .bold, design: .monospaced), alpha: 0.90, offset: CGSize(width: 10, height: 0), anchor: .leading))

                        if showTicks {
                            let tickColor = Color.white
                            let labelEvery = units <= 6 ? 1 : 2
                            let small = max(0.15, Double(units) * 0.04)

                            for i in stride(from: -units, through: units, by: labelEvery) {
                                if i == 0 { continue }
                                let t = Double(i)

                                addLine(Vec3(x: t, y: -small, z: 0), Vec3(x: t, y: small, z: 0), color: tickColor, width: 1, alpha: 0.65)
                                addLine(Vec3(x: -small, y: t, z: 0), Vec3(x: small, y: t, z: 0), color: tickColor, width: 1, alpha: 0.65)
                                addLine(Vec3(x: -small, y: 0, z: t), Vec3(x: small, y: 0, z: t), color: tickColor, width: 1, alpha: 0.65)

                                labels.append(Label(at: Vec3(x: t, y: 0, z: 0), text: "\(i)", color: .white, font: .system(size: 11, weight: .regular, design: .monospaced), alpha: 0.75, offset: CGSize(width: 0, height: 14), anchor: .center))
                                labels.append(Label(at: Vec3(x: 0, y: t, z: 0), text: "\(i)", color: .white, font: .system(size: 11, weight: .regular, design: .monospaced), alpha: 0.75, offset: CGSize(width: 14, height: 0), anchor: .leading))
                                labels.append(Label(at: Vec3(x: 0, y: 0, z: t), text: "\(i)", color: .white, font: .system(size: 11, weight: .regular, design: .monospaced), alpha: 0.75, offset: CGSize(width: 14, height: 0), anchor: .leading))
                            }
                        }

                        for (i, v) in vecs.enumerated() {
                            if v.length < 1e-9 { continue }

                            let c: Color = i == 0 ? accentColor : (i == 1 ? .cyan : .purple)
                            addArrow(.zero, v, color: c, width: 3, headSize: 10, alpha: 1.0)
                            dots.append(Dot(at: v, color: c, radius: 3, alpha: 1.0))

                            let label = "v\(i + 1) = (\(formatScalar(v.x)), \(formatScalar(v.y)), \(formatScalar(v.z)))"
                            labels.append(Label(at: v, text: label, color: c, font: .system(size: 11, weight: .bold, design: .monospaced), alpha: 0.95, offset: CGSize(width: 10, height: -10), anchor: .leading))
                        }

                        lines.sort { (depth($0.a) + depth($0.b)) < (depth($1.a) + depth($1.b)) }
                        for line in lines {
                            var path = Path()
                            path.move(to: project(line.a))
                            path.addLine(to: project(line.b))
                            context.stroke(path, with: .color(line.color.opacity(line.alpha)), lineWidth: line.width)
                        }

                        arrowHeads.sort { depth($0.to) < depth($1.to) }
                        for head in arrowHeads {
                            let tip = project(head.to)
                            let tail = project(head.from)

                            let dx = tip.x - tail.x
                            let dy = tip.y - tail.y
                            let len = max(1.0, sqrt(dx * dx + dy * dy))
                            let ux = dx / len
                            let uy = dy / len

                            let backX = tip.x - ux * head.size
                            let backY = tip.y - uy * head.size
                            let orthoX = -uy
                            let orthoY = ux

                            let left = CGPoint(x: backX + orthoX * head.size * 0.55, y: backY + orthoY * head.size * 0.55)
                            let right = CGPoint(x: backX - orthoX * head.size * 0.55, y: backY - orthoY * head.size * 0.55)

                            var tri = Path()
                            tri.move(to: tip)
                            tri.addLine(to: left)
                            tri.addLine(to: right)
                            tri.closeSubpath()
                            context.fill(tri, with: .color(head.color.opacity(head.alpha)))
                        }

                        dots.sort { depth($0.at) < depth($1.at) }
                        for dot in dots {
                            let p = project(dot.at)
                            let rect = CGRect(x: p.x - dot.radius, y: p.y - dot.radius, width: dot.radius * 2, height: dot.radius * 2)
                            context.fill(Path(ellipseIn: rect), with: .color(dot.color.opacity(dot.alpha)))
                        }

                        labels.sort { depth($0.at) < depth($1.at) }
                        for l in labels {
                            let p = project(l.at)
                            context.draw(Text(l.text).font(l.font).foregroundColor(l.color.opacity(l.alpha)), at: CGPoint(x: p.x + l.offset.width, y: p.y + l.offset.height), anchor: l.anchor)
                        }
                    }
                    .background(Color.black.opacity(0.8))
                    .cornerRadius(12)
                    
                    ScrollDetector(zoom: $zoom)
                }
                .frame(height: 520)
                .overlay(alignment: .topTrailing) {
                    HStack(spacing: 6) {
                        PlotIconButton(title: "-", background: true) {
                            zoom = max(0.25, zoom * 0.9)
                        }
                        PlotIconButton(title: "+", background: true) {
                            zoom = min(4.0, zoom * 1.1)
                        }
                        PlotIconButton(title: "R", background: true) {
                            withAnimation {
                                rotation = (-0.55, 0.75, 0.0)
                            }
                        }
                    }
                    .padding(10)
                }
                .overlay(alignment: .topLeading) {
                    VStack(alignment: .leading, spacing: 6) {
                        PlotLegendRow(color: Color(red: 1.0, green: 0.2588, blue: 0.4196), label: "x")
                        PlotLegendRow(color: Color(red: 0.2196, green: 1.0, blue: 0.4196), label: "y")
                        PlotLegendRow(color: Color(red: 0.4706, green: 0.6275, blue: 1.0), label: "z")
                    }
                    .padding(10)
                }
                .overlay(alignment: .bottomLeading) {
                    HStack(spacing: 6) {
                        PlotToggleButton(title: "Box", isOn: showBox) { showBox.toggle() }
                        PlotToggleButton(title: "Planes", isOn: showCoordPlanes) { showCoordPlanes.toggle() }
                        PlotToggleButton(title: "Ticks", isOn: showTicks) { showTicks.toggle() }
                    }
                    .padding(10)
                }
                .gesture(
                    DragGesture()
                        .onChanged { value in
                            let dx = value.translation.width - lastDragTranslation.width
                            let dy = value.translation.height - lastDragTranslation.height
                            lastDragTranslation = value.translation
                            rotation.rx += dy * 0.008
                            rotation.ry += dx * 0.008
                        }
                        .onEnded { _ in
                            lastDragTranslation = .zero
                        }
                )
                .simultaneousGesture(
                    MagnificationGesture()
                        .onChanged { value in
                            if zoomStart == nil { zoomStart = zoom }
                            guard let zoomStart else { return }
                            zoom = min(4.0, max(0.25, zoomStart * value))
                        }
                        .onEnded { _ in
                            zoomStart = nil
                        }
                )
            }
        }
    }
}

private struct ScrollDetector: NSViewRepresentable {
    @Binding var zoom: Double
    
    func makeNSView(context: Context) -> ScrollOverlayView {
        let view = ScrollOverlayView()
        // Initial setup
        view.onScroll = { delta in
            let scaleFactor = 1.0 + (delta * 0.05)
            let newZoom = self.zoom * scaleFactor
            self.zoom = min(4.0, max(0.25, newZoom))
        }
        return view
    }
    
    func updateNSView(_ nsView: ScrollOverlayView, context: Context) {
        // Update closure to capture latest binding
        nsView.onScroll = { delta in
            let scaleFactor = 1.0 + (delta * 0.05)
            let newZoom = self.zoom * scaleFactor
            self.zoom = min(4.0, max(0.25, newZoom))
        }
    }
    
    class ScrollOverlayView: NSView {
        var onScroll: ((CGFloat) -> Void)?
        private var monitor: Any?
        
        override func hitTest(_ point: NSPoint) -> NSView? {
            // Return nil to let events pass through to views behind (e.g. DragGesture)
            return nil
        }
        
        override func viewDidMoveToWindow() {
            super.viewDidMoveToWindow()
            // Clean up existing monitor if any
            if let monitor = monitor {
                NSEvent.removeMonitor(monitor)
                self.monitor = nil
            }
            
            // Add new monitor if attached to window
            if window != nil {
                monitor = NSEvent.addLocalMonitorForEvents(matching: .scrollWheel) { [weak self] event in
                    guard let self = self else { return event }
                    
                    // Check if mouse is over this view
                    // locationInWindow is in window coordinates (bottom-left origin)
                    let localPoint = self.convert(event.locationInWindow, from: nil)
                    
                    // bounds check
                    if self.bounds.contains(localPoint) {
                        // Handle scroll
                        // Note: event.deltaY > 0 usually means scroll up (zoom in)
                        self.onScroll?(event.deltaY)
                        return nil // Consume event to prevent parent scrolling
                    }
                    return event
                }
            }
        }
        
        deinit {
            if let monitor = monitor {
                NSEvent.removeMonitor(monitor)
            }
        }
    }
}

private struct PlotIconButton: View {
    let title: String
    let background: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 12, weight: .bold, design: .monospaced))
                .frame(width: 32, height: 32)
                .background(background ? Color.black.opacity(0.6) : Color.clear)
                .cornerRadius(8)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.white.opacity(0.2), lineWidth: 1)
                )
                .foregroundColor(Color.white)
        }
        .buttonStyle(.plain)
    }
}

private struct PlotToggleButton: View {
    let title: String
    let isOn: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 10, weight: .bold))
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(Color.black.opacity(0.6))
                .cornerRadius(8)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.white.opacity(0.15), lineWidth: 1)
                )
                .foregroundColor(isOn ? Color.white : Color.white.opacity(0.6))
        }
        .buttonStyle(.plain)
    }
}

private struct PlotLegendRow: View {
    let color: Color
    let label: String

    var body: some View {
        HStack(spacing: 8) {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(label)
                .font(.system(size: 10, weight: .bold, design: .monospaced))
                .foregroundColor(Color.white.opacity(0.8))
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(Color.black.opacity(0.6))
        .cornerRadius(8)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.white.opacity(0.2), lineWidth: 1)
        )
    }
}
