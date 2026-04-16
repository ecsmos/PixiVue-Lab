# PixiVue-Lab 🚀

[**Live Demo**](https://ecsmos.github.io/PixiVue-Lab/)

A high-performance monorepo for exploring cutting-edge web technologies, specifically focused on **WebGPU**, **PixiJS v8**, and **Entity-Component-System (ECS)** patterns within the **Vue 3** ecosystem.

## 🌟 Overview

PixiVue-Lab is a "lab" project designed to test the limits of modern web graphics and state management. It demonstrates how to combine the declarative nature of Vue with the raw performance of WebGPU and data-oriented ECS.

The project is structured to host multiple parallel experiments, each accessible via its own subdirectory on GitHub Pages.

## 🛠️ Tech Stack

- **Core Engine**: [PixiJS v8](https://pixijs.com/) — Leveraging the latest WebGPU and WebGL2 rendering capabilities.
- **Rendering API**: **WebGPU** with custom **WGSL** (WebGPU Shading Language) shaders.
- **State Management**: [BitECS](https://github.com/NateTheGreatt/bitECS) — A lightning-fast, data-oriented ECS for handling thousands of entities.
- **Framework**: [Vue 3](https://vuejs.org/) — Reactive UI for controlling simulation parameters.
- **Monorepo**: [Turbo](https://turbo.build/) + [Bun](https://bun.sh/) — Fast builds and efficient dependency management.
- **Linter/Formatter**: [Biome](https://biomejs.dev/) — Next-generation toolchain for web projects.

## 📂 Project Structure

```bash
PixiVue-Lab/
├── apps/
│   ├── bunnies/      # 🐰 Space-themed high-performance stress test
│   └── forest/       # 🌲 Forest-themed simulation with sunlight shaders
├── packages/         # Shared utilities and types
├── .github/          # CI/CD workflows for multi-project deployment
└── README.md         # This documentation
```

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.1.0 or higher)
- A browser with [WebGPU support](https://caniuse.com/webgpu) (Chrome 113+, Edge 113+)

### Installation

```bash
# Clone the repository
git clone https://github.com/ecsmos/PixiVue-Lab.git
cd PixiVue-Lab

# Install dependencies
bun install
```

### Running Locally

```bash
# Start all applications in development mode
bun dev

# Run specific application
bun dev --filter forest
```

## 🧪 Current Experiments

### 1. [Bunnies](https://ecsmos.github.io/PixiVue-Lab/bunnies/) (apps/bunnies)
A modern take on the classic "Bunnymark" in deep space.
- **Theme**: Deep space, nebula, stars.
- **Shaders**: Procedural space background, pulsing nebula glow on entities.

### 2. [Forest](https://ecsmos.github.io/PixiVue-Lab/forest/) (apps/forest)
An organic-themed simulation exploring sunlight and wind effects.
- **Theme**: Forest canopy, moss, sunlight shafts.
- **Shaders**: Sunlight beams (sun shafts), wind-driven swaying animations, subsurface scattering effects on leaves.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
