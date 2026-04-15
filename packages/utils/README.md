# @pixivue-lab/utils 🛠️

Shared utilities and mathematical helpers for high-performance graphics experiments.

## 📦 Features

- **Performance-First**: Minimal object allocations, optimized for high-frequency loops.
- **TypeScript First**: Fully typed with exhaustive JSDoc comments.
- **Modular**: Designed to be reused across different apps in the monorepo.

## 🚀 Usage

```typescript
import { lerp, distSq } from '@pixivue-lab/utils';

// Linear interpolation
const value = lerp(0, 100, 0.5); // 50

// Faster distance check without Math.sqrt
if (distSq(x1, y1, x2, y2) < radius * radius) {
  // Collision!
}
```
