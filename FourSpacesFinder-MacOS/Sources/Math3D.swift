import Foundation

struct Vec3: Equatable {
    var x: Double
    var y: Double
    var z: Double
    
    static let zero = Vec3(x: 0, y: 0, z: 0)
    
    static func +(lhs: Vec3, rhs: Vec3) -> Vec3 {
        return Vec3(x: lhs.x + rhs.x, y: lhs.y + rhs.y, z: lhs.z + rhs.z)
    }
    
    static func -(lhs: Vec3, rhs: Vec3) -> Vec3 {
        return Vec3(x: lhs.x - rhs.x, y: lhs.y - rhs.y, z: lhs.z - rhs.z)
    }
    
    static func *(lhs: Vec3, rhs: Double) -> Vec3 {
        return Vec3(x: lhs.x * rhs, y: lhs.y * rhs, z: lhs.z * rhs)
    }
    
    var length: Double {
        return sqrt(x*x + y*y + z*z)
    }
    
    var normalized: Vec3 {
        let len = length
        if len < 1e-12 { return .zero }
        return self * (1.0 / len)
    }
    
    func dot(_ rhs: Vec3) -> Double {
        return x * rhs.x + y * rhs.y + z * rhs.z
    }
    
    func cross(_ rhs: Vec3) -> Vec3 {
        return Vec3(
            x: y * rhs.z - z * rhs.y,
            y: z * rhs.x - x * rhs.z,
            z: x * rhs.y - y * rhs.x
        )
    }
    
    // Rotations
    func rotateX(_ angle: Double) -> Vec3 {
        let c = cos(angle)
        let s = sin(angle)
        return Vec3(x: x, y: y * c - z * s, z: y * s + z * c)
    }
    
    func rotateY(_ angle: Double) -> Vec3 {
        let c = cos(angle)
        let s = sin(angle)
        return Vec3(x: x * c + z * s, y: y, z: -x * s + z * c)
    }
    
    func rotateZ(_ angle: Double) -> Vec3 {
        let c = cos(angle)
        let s = sin(angle)
        return Vec3(x: x * c - y * s, y: x * s + y * c, z: z)
    }
    
    func applyRotation(rx: Double, ry: Double, rz: Double) -> Vec3 {
        return self.rotateX(rx).rotateY(ry).rotateZ(rz)
    }
}
