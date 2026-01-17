import SwiftUI
import AppKit

private struct AboutPerson: Identifiable {
    let id = UUID()
    let name: String
    let imageFileName: String?
}

struct AboutView: View {
    @Environment(\.dismiss) private var dismiss
    
    private let people: [AboutPerson] = [
        AboutPerson(name: "Magalona, Adriel", imageFileName: "Adriel.png"),
        AboutPerson(name: "Puti, Jude Vincent", imageFileName: "Vince.jpg"),
        AboutPerson(name: "Lozano, Mad Edison", imageFileName: "Mac.jpg"),
        AboutPerson(name: "Monterey, Reine Arabelle", imageFileName: "Reine.jpg"),
        AboutPerson(name: "Dotollo, Zyrah Mae", imageFileName: "Zyrah.JPG"),
        AboutPerson(name: "Castillejo, Paul Daniel", imageFileName: "Paul.jpg")
    ]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                GlassPanel {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Four Fundamental Spaces Finder")
                                .font(.title2)
                                .bold()
                            Spacer()
                            GlassButton(title: "Done", icon: "xmark") {
                                dismiss()
                            }
                            .font(.caption)
                        }
                        
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Final Project in Linear Algebra")
                                .font(.system(size: 13, weight: .bold))
                            
                            Text("Project Goal: Build a program/application that accepts an m-by-n matrix (where m, n ≤ 5) and returns bases for its four fundamental subspaces.")
                                .font(.system(size: 12, weight: .regular))
                                .foregroundStyle(.secondary)
                                .fixedSize(horizontal: false, vertical: true)
                            
                            Text("We implemented additional features including LaTeX equation copying, geometric visualization of subspaces in 2D/3D planes, and detailed calculation steps showing the Row Reduced Echelon Form (RREF) process.")
                                .font(.system(size: 12, weight: .regular))
                                .foregroundStyle(.secondary)
                                .fixedSize(horizontal: false, vertical: true)
                            
                            Text("Made by the Students of Polytechnic University of the Philippines by BSCS 2-2 students under Professor John Patrick B. Sta Maria")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundStyle(.primary)
                                .padding(.top, 4)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                }
                
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 240), spacing: 16)], spacing: 16) {
                    ForEach(people) { p in
                        GlassPanel {
                            HStack(spacing: 14) {
                                AboutAvatar(name: p.name, imageFileName: p.imageFileName)
                                
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(p.name)
                                        .font(.system(size: 13, weight: .bold))
                                        .lineLimit(1)
                                    Text("Contributor")
                                        .font(.system(size: 11, weight: .medium))
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                            }
                        }
                    }
                }
            }
            .padding()
        }
        .background(
            LinearGradient(colors: [Color.gray.opacity(0.08), Color.gray.opacity(0.16)], startPoint: .topLeading, endPoint: .bottomTrailing)
        )
    }
}

private struct AboutAvatar: View {
    let name: String
    let imageFileName: String?
    
    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color.white.opacity(0.15))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(Color.white.opacity(0.22), lineWidth: 1)
                )
            
            if let imageFileName, let nsImage = loadNSImage(from: imageFileName) {
                Image(nsImage: nsImage)
                    .resizable()
                    .scaledToFill()
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            } else {
                VStack(spacing: 3) {
                    Text(initials(from: name))
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                    Text("Image")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(.secondary)
                }
            }
        }
        .frame(width: 64, height: 64)
        .clipped()
    }
    
    private func initials(from name: String) -> String {
        let parts = name
            .replacingOccurrences(of: ",", with: " ")
            .split(separator: " ")
            .map(String.init)
            .filter { !$0.isEmpty }
        let a = parts.first?.first.map(String.init) ?? ""
        let b = parts.dropFirst().first?.first.map(String.init) ?? ""
        return (a + b).uppercased()
    }
    
    private func loadNSImage(from fileName: String) -> NSImage? {
        let ext = (fileName as NSString).pathExtension
        let base = (fileName as NSString).deletingPathExtension
        guard let url = Bundle.main.url(forResource: base, withExtension: ext) else { return nil }
        return NSImage(contentsOf: url)
    }
}
