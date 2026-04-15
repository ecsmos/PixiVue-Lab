# PixiVue-Lab 🚀

A high-performance monorepo for exploring cutting-edge web technologies, specifically focused on **WebGPU**, **PixiJS v8**, and **Entity-Component-System (ECS)** patterns within the **Vue 3** ecosystem.

## 🌟 Overview

PixiVue-Lab is a "lab" project designed to test the limits of modern web graphics and state management. It demonstrates how to combine the declarative nature of Vue with the raw performance of WebGPU and data-oriented ECS.

## 🛠️ Tech Stack

- **Core Engine**: [PixiJS v8](https://pixijs.com/) — Leveraging the latest WebGPU and WebGL2 rendering capabilities.
- **Rendering API**: **WebGPU** with custom **WGSL** (WebGPU Shading Language) shaders.
- **State Management**: [BitECS](https://github.com/NateTheGreatt/bitECS) — A lightning-fast, data-oriented ECS for handling thousands of entities.
- **Framework**: [Vue 3](https://vuejs.org/) — Reactive UI for controlling simulation parameters.
- **Monorepo**: [Turbo](https://turbo.build/) + [Bun](https://bun.sh/) — Fast builds and efficient dependency management.
- **Linter/Formatter**: [Biome](https://biomejs.dev/) — Next-generation toolchain for web projects.

## 📂 Project Structure

\`\`\`bash
PixiVue-Lab/
├── apps/
│   └── bunnies/      # High-performance stress test (Bunnymark)
├── packages/         # Shared utilities and types (upcoming)
├── turbo.json        # Pipeline configuration
└── package.json      # Monorepo workspace configuration
\`\`\`

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.1.0 or higher)
- A browser with [WebGPU support](https://caniuse.com/webgpu) (Chrome 113+, Edge 113+)

### Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/your-username/PixiVue-Lab.git
cd PixiVue-Lab

# Install dependencies
bun install
\`\`\`

### Running Locally

\`\`\`bash
# Start all applications in development mode
bun dev
\`\`\`

## 🐇 Current Experiments

### 1. Bunnies (apps/bunnies)
A modern take on the classic "Bunnymark". 
- **Features**:
  - Thousands of interactive bunnies managed via **BitECS**.
  - Custom **WGSL** background and post-processing shaders.
  - Interactive mouse-driven particle effects.
  - Real-time simulation control panel built with Vue + Pinia.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
