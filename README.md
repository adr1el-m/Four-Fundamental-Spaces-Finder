# Four Fundamental Spaces Finder

<img src="FourSpacesFinder-Web/public/asset/img/readme/coverPage.png" alt="Cover Page" width="900">

A comprehensive Linear Algebra tool designed to calculate and visualize the four fundamental subspaces of a matrix: Column Space, Row Space, Null Space, and Left Null Space. This application provides step-by-step Row Reduced Echelon Form (RREF) calculations, LaTeX support for equations, and interactive 2D/3D geometric visualizations.

## Features

- **Matrix Calculation**: Support for matrices up to 5x5 with fraction arithmetic.
- **Step-by-Step RREF**: Detailed view of the Gaussian elimination process.
- **Fundamental Spaces**: Derivation and basis vectors for $C(A)$, $R(A)$, $N(A)$, and $N(A^T)$.
- **Geometric Visualization**: Interactive 3D and 2D plotting of subspaces.
- **Cross-Platform**: Available as a Native macOS application and a responsive Web application.

---

## Web Version

Experience the tool directly in your browser with a modern, responsive interface.

### Landing Page & Matrix Input
<img src="FourSpacesFinder-Web/public/asset/img/readme/LandingPage.png" alt="Landing Page" width="900">

### Geometric Visualization
<img src="FourSpacesFinder-Web/public/asset/img/readme/GeometricVisualization.png" alt="Geometric Visualization" width="900">

---

## Native macOS Version

A high-performance native Swift application optimized for macOS, offering the same powerful features with a system-integrated feel.

### Computations
<img src="FourSpacesFinder-Web/public/asset/img/readme/Computation-mac.jpeg" alt="macOS Computations" width="900">

### Geometric Visualization
<img src="FourSpacesFinder-Web/public/asset/img/readme/GeometricVisualization-mac.jpeg" alt="macOS Geometric Visualization" width="900">

---

## BSCS 2-2 Group 5

<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td align="center" width="33.33%">
      <img src="FourSpacesFinder-Web/public/asset/img/Adriel.png" alt="Adriel Magalona" style="border-radius: 50%; width: 120px; height: 120px; object-fit: cover;"><br>
      <strong>Adriel Magalona</strong><br>
      <a href="https://www.linkedin.com/in/adr1el/">
        <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn">
      </a>
    </td>
    <td align="center" width="33.33%">
      <img src="FourSpacesFinder-Web/public/asset/img/Vince.jpg" alt="Jude Vincent Puti" style="border-radius: 50%; width: 120px; height: 120px; object-fit: cover;"><br>
      <strong>Jude Vincent Puti</strong><br>
      <a href="https://www.linkedin.com/in/jude-vincent-puti-31132b2b2/">
        <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn">
      </a>
    </td>
    <td align="center" width="33.33%">
      <img src="FourSpacesFinder-Web/public/asset/img/Mac.jpg" alt="Mac Edison Lozano" style="border-radius: 50%; width: 120px; height: 120px; object-fit: cover;"><br>
      <strong>Mac Edison Lozano</strong><br>
      <a href="https://www.linkedin.com/in/mac-lozano-061b96312/">
        <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn">
      </a>
    </td>
  </tr>
  <tr>
    <td align="center" width="33.33%" style="padding-top: 20px;">
      <img src="FourSpacesFinder-Web/public/asset/img/Reine.jpg" alt="Reine Arabelle Monterey" style="border-radius: 50%; width: 120px; height: 120px; object-fit: cover;"><br>
      <strong>Reine Arabelle Monterey</strong><br>
      <a href="https://www.linkedin.com/in/reine-arabelle-monterey/">
        <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn">
      </a>
    </td>
    <td align="center" width="33.33%" style="padding-top: 20px;">
      <img src="FourSpacesFinder-Web/public/asset/img/Zyrah.JPG" alt="Zyrah Mae Dotollo" style="border-radius: 50%; width: 120px; height: 120px; object-fit: cover;"><br>
      <strong>Zyrah Mae Dotollo</strong><br>
      <a href="https://www.linkedin.com/in/zyrah-mae-m-dotollo/">
        <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn">
      </a>
    </td>
    <td align="center" width="33.33%" style="padding-top: 20px;">
      <img src="FourSpacesFinder-Web/public/asset/img/Paul.jpg" alt="Paul Daniel Castillejo" style="border-radius: 50%; width: 120px; height: 120px; object-fit: cover;"><br>
      <strong>Paul Daniel Castillejo</strong><br>
      <a href="https://www.linkedin.com/in/paul-daniel-castillejo/">
        <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn">
      </a>
    </td>
  </tr>
</table>

## Comprehensive Repository Structure

```text
FourSpacesRepo/
├── FourSpacesFinder-Web/                 # Next.js web application
│   ├── app/                              # App Router pages (/, /about)
│   ├── components/                       # UI + feature components
│   ├── lib/                              # Custom math + utilities
│   ├── public/                           # Static assets (images, icons)
│   ├── package.json                      # Web scripts and dependencies
│   └── next.config.ts                    # Next.js configuration
├── FourSpacesFinder-MacOS/               # Native macOS (Swift/SwiftUI) app
│   ├── Sources/                          # SwiftUI views + math engine
│   ├── Resources/                        # App icons and bundled assets
│   ├── build_dmg.sh                      # DMG packaging script
│   └── run_dev.sh                        # Local dev helper script
├── README.md                             # Project documentation (this file)
└── .gitignore                            # Git ignore rules
```

Made by the Students of Polytechnic University of the Philippines by BSCS 2-2 students under Professor John Patrick B. Sta Maria
