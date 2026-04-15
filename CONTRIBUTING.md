# Contributing to PixiVue-Lab 🤝

Thank you for your interest! As a laboratory project, we value exploration and technical excellence.

## 🛠️ Development Environment

- **Bun**: This project uses [Bun](https://bun.sh/) as its package manager and runtime.
- **Turborepo**: Manages build pipelines and workspace dependencies.
- **Biome**: Linter and formatter (configured in `biome.json`).

## 📁 Workflow

1.  **Fork the repository** and create a feature branch.
2.  **Ensure code quality**: Run `bun lint` before committing.
3.  **Experiment**: Feel free to add new "apps" in the `apps/` directory or utilities in `packages/`.
4.  **Submit a PR** with a clear description of your experiment or improvement.

## 🔍 Code Standards

-   Use **TypeScript** with strict typing wherever possible.
-   Follow **Data-Oriented Design** for high-frequency loops (using BitECS or Typed Arrays).
-   Minimize GC pressure by reusing objects or using buffers.
-   Document any custom shaders with WGSL comments.

## 🚀 Future Roadmap

- [ ] Add more complex ECS systems (behavior-based AI).
- [ ] Implement a shared `packages/math` utility for common graphics operations.
- [ ] Add support for WebXR experiments.
