# 🐇 PixiVue-Lab: Bunnymark

A high-performance interactive stress test built with **PixiJS v8**, **WebGPU**, and **BitECS**.

## 🚀 Key Features

- **PixiJS v8 (WebGPU)**: Utilizes the latest rendering engine for maximum performance.
- **BitECS Engine**: Uses a data-oriented Entity-Component-System (ECS) for efficient management of thousands of entities.
- **Custom WGSL Shaders**:
  - **Dynamic Background**: A procedural "deep space" background with parallax stars and nebula effects.
  - **Mouse Interaction**: Real-time shader influence based on mouse position (distance-based lighting and glows).
  - **Post-Processing**: Bunny textures are mixed with procedural space effects.
- **Real-time Control**: A Vue 3 + Pinia control panel to tweak:
  - Simulation speed
  - Spawn rates
  - Shader intensity
  - Collision detection

## ⚙️ Performance Highlights

- **Typed Arrays**: BitECS stores all data in `Float32Array` buffers to ensure cache locality and zero GC pressure during the simulation loop.
- **WebGPU Pipeline**: Custom shaders are written in WGSL, taking full advantage of the modern GPU hardware.
- **Optimized Rendering**: Leverages PixiJS v8's efficient batching and pipeline management.

## 🛠️ Architecture

The application follows a clean separation of concerns:
- **Vue components** handle the UI and reactive store updates.
- **BitECS systems** handle the heavy lifting: movement, collision, and mapping ECS data to PixiJS sprites.
- **PixiJS Ticker** drives the high-frequency update loop.

## 🏃 Running the Demo

```bash
# From the root directory
bun dev --filter bunnies
```
