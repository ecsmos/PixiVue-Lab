# 🌲 PixiVue-Lab: Forest Simulation

A high-performance interactive forest simulation built with **PixiJS v8**, **WebGPU**, and **BitECS**.

## 🚀 Key Features

- **PixiJS v8 (WebGPU)**: Utilizes the latest rendering engine for maximum performance.
- **BitECS Engine**: Uses a data-oriented Entity-Component-System (ECS) for efficient management of thousands of entities.
- **Custom WGSL Shaders**:
  - **Forest Canopy**: A procedural forest background with sunlight shafts and swaying moss effects.
  - **Mouse Interaction**: Sunlight follows the mouse, illuminating the canopy.
  - **Leaf Effects**: Leaf particles are mixed with procedural sunlight and swaying animations.
- **Real-time Control**: A Vue 3 + Pinia control panel to tweak:
  - Wind speed
  - Spawn rates
  - Sunlight intensity
  - Leaf collisions

## ⚙️ Performance Highlights

- **Typed Arrays**: BitECS stores all data in `Float32Array` buffers to ensure cache locality and zero GC pressure.
- **WebGPU Pipeline**: Custom shaders are written in WGSL, optimized for modern GPU hardware.
- **Optimized Rendering**: Leverages PixiJS v8's efficient batching.

## 🏃 Running the Demo

```bash
# From the root directory
bun dev --filter forest
```
