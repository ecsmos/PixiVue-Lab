<script setup lang="ts">
import {
  addComponent,
  addEntity,
  createWorld,
  query,
  type World,
} from 'bitecs';
import {
  Application,
  Assets,
  Container,
  Filter,
  Sprite,
  Texture,
  UniformGroup,
} from 'pixi.js';
import { onMounted, onUnmounted, ref } from 'vue';
import { useSimulationStore } from '../stores/simulation';

const container = ref<HTMLElement | null>(null);
const app = new Application();
const store = useSimulationStore();

// 1. Define ECS Components
const Position = { x: new Float32Array(10000), y: new Float32Array(10000) };
const Velocity = { x: new Float32Array(10000), y: new Float32Array(10000) };
const Rotation = {
  angle: new Float32Array(10000),
  angularVelocity: new Float32Array(10000),
};
const Scale = { s: new Float32Array(10000) };

const world = createWorld();
const sprites = new Map<number, Sprite>();
const bunniesContainer = new Container();

// 2. Custom WebGPU Shader (WGSL) for background
const bgGpuShader = `
struct GlobalFilterUniforms {
  uInputSize: vec4<f32>,
  uInputPixel: vec4<f32>,
  uInputClamp: vec4<f32>,
  uOutputFrame: vec4<f32>,
  uGlobalFrame: vec4<f32>,
  uOutputTexture: vec4<f32>,
};

@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;
@group(0) @binding(1) var uTexture: texture_2d<f32>;
@group(0) @binding(2) var uSampler: sampler;

struct VSOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>
};

fn filterVertexPosition(aPosition: vec2<f32>) -> vec4<f32> {
    var position = aPosition * gfu.uOutputFrame.zw + gfu.uOutputFrame.xy;
    position.x = position.x * (2.0 / gfu.uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0 * gfu.uOutputTexture.z / gfu.uOutputTexture.y) - gfu.uOutputTexture.z;
    return vec4(position, 0.0, 1.0);
}

fn filterTextureCoord(aPosition: vec2<f32>) -> vec2<f32> {
    return aPosition * (gfu.uOutputFrame.zw * gfu.uInputSize.zw);
}

@vertex
fn mainVertex(
  @location(0) aPosition: vec2<f32>,
) -> VSOutput {
  return VSOutput(
   filterVertexPosition(aPosition),
   filterTextureCoord(aPosition)
  );
}

struct BgUniforms {
  time: f32,
  resolution: vec2<f32>,
  mouse: vec2<f32>,
};

@group(1) @binding(0) var<uniform> bgUniforms: BgUniforms;

fn hash(p: vec2<f32>) -> f32 {
    return fract(sin(dot(p, vec2<f32>(12.9898, 78.233))) * 43758.5453);
}

@fragment
fn mainFrag(
  @location(0) uv: vec2<f32>,
  @builtin(position) position: vec4<f32>
) -> @location(0) vec4<f32> {
    let t = bgUniforms.time * 0.1;
    
    // Calculate accurate screen UV [0, 1] ignoring padding and considering resolution
    let screenUV = (position.xy - gfu.uGlobalFrame.xy) / gfu.uGlobalFrame.zw;
    
    let st = screenUV * 2.0 - 1.0;
    let aspect = bgUniforms.resolution.x / bgUniforms.resolution.y;
    let p = st * vec2<f32>(aspect, 1.0);
    
    // Convert screen coordinates to normalized shader coordinates [-1, 1] with aspect ratio
    let m = (bgUniforms.mouse * 2.0 - 1.0) * vec2<f32>(aspect, 1.0);
    let distToMouse = length(p - m);
    let mouseInfluence = smoothstep(0.5, 0.0, distToMouse);
    
    // Background color: deep space blue/purple, slightly influenced by mouse
    var color = mix(vec3<f32>(0.02, 0.01, 0.05), vec3<f32>(0.05, 0.02, 0.1), mouseInfluence);
    
    // Create "stars" or "nebula" layers
    for(var i: f32 = 1.0; i < 4.0; i += 1.0) {
        // Shift stars based on mouse position (parallax effect)
        let parallax = m * 0.05 * i;
        let uv_layer = p * (1.5 + i * 0.5) + vec2<f32>(cos(t * 0.1 * i), sin(t * 0.15 * i)) - parallax;
        let grid = floor(uv_layer * 15.0);
        let f = fract(uv_layer * 15.0) - 0.5;
        
        let h = hash(grid + i * 123.456);
        if (h > 0.985) {
            let dist = length(f);
            let sparkle = sin(bgUniforms.time * 5.0 + h * 10.0) * 0.5 + 0.5;
            
            // Stars get brighter near mouse
            let starBrightness = (0.003 / dist) * sparkle * (1.0 + mouseInfluence * 2.0);
            color += vec3<f32>(0.8, 0.9, 1.0) * starBrightness;
        }
    }
    
    // Nebula clouds with mouse interaction
    let nebula_pos = p * 0.8 + vec2<f32>(sin(t * 0.2), cos(t * 0.15)) - m * 0.1;
    let n1 = sin(nebula_pos.x * 2.0 + t) * sin(nebula_pos.y * 3.0 - t);
    let n2 = sin(nebula_pos.y * 2.5 + t * 0.8) * sin(nebula_pos.x * 1.5 - t * 0.5);
    
    let nebulaBase = (n1 + n2 + 1.0) * 0.5;
    color += vec3<f32>(0.15, 0.08, 0.25) * nebulaBase * (1.0 + mouseInfluence);
    
    // Add a subtle glow around the mouse
    color += vec3<f32>(0.1, 0.2, 0.4) * exp(-distToMouse * 4.0);
    
    return vec4<f32>(color, 1.0);
}
`;

// 3. Custom WebGPU Shader (WGSL) for bunnies
// Pixi v8 Filter WGSL conventions:
// - Global uniforms (uInputSize, etc.) are at @group(0) @binding(0)
// - Filter-specific resources (uTexture, uSampler, myUniforms) are in @group(1)
const gpuShader = `
struct GlobalFilterUniforms {
  uInputSize: vec4<f32>,
  uInputPixel: vec4<f32>,
  uInputClamp: vec4<f32>,
  uOutputFrame: vec4<f32>,
  uGlobalFrame: vec4<f32>,
  uOutputTexture: vec4<f32>,
};

@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;
@group(0) @binding(1) var uTexture: texture_2d<f32>;
@group(0) @binding(2) var uSampler: sampler;

struct VSOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>
};

fn filterVertexPosition(aPosition: vec2<f32>) -> vec4<f32> {
    var position = aPosition * gfu.uOutputFrame.zw + gfu.uOutputFrame.xy;
    position.x = position.x * (2.0 / gfu.uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0 * gfu.uOutputTexture.z / gfu.uOutputTexture.y) - gfu.uOutputTexture.z;
    return vec4(position, 0.0, 1.0);
}

fn filterTextureCoord(aPosition: vec2<f32>) -> vec2<f32> {
    return aPosition * (gfu.uOutputFrame.zw * gfu.uInputSize.zw);
}

@vertex
fn mainVertex(
  @location(0) aPosition: vec2<f32>,
) -> VSOutput {
  return VSOutput(
   filterVertexPosition(aPosition),
   filterTextureCoord(aPosition)
  );
}

struct MyUniforms {
  intensity: f32,
  time: f32,
};

@group(1) @binding(0) var<uniform> myUniforms: MyUniforms;

@fragment
fn mainFrag(
  @location(0) uv: vec2<f32>,
  @builtin(position) position: vec4<f32>
) -> @location(0) vec4<f32> {
  var color = textureSample(uTexture, uSampler, uv);
  if (color.a == 0.0) {
    return color;
  }

  let t = myUniforms.time * 0.5;
  let i = myUniforms.intensity;

  // Space-like effect for bunnies: pulsing nebula glow + star sparkles
  let st = uv * 2.0 - 1.0;
  let dist = length(st);
  
  // Pulsing blue/purple core
  let pulse = sin(t * 2.0) * 0.2 + 0.8;
  let nebulaColor = vec3<f32>(0.2, 0.4, 1.0) * pulse;
  
  // Star sparkle effect inside the bunny
  let sparkle = sin(st.x * 10.0 + t * 5.0) * cos(st.y * 10.0 - t * 3.0);
  let stars = smoothstep(0.7, 1.0, sparkle) * vec3<f32>(1.0, 1.0, 1.0);

  let finalEffect = mix(nebulaColor, nebulaColor + stars, 0.5);

  // Mix original bunny texture with the space effect
  color = vec4<f32>(mix(color.rgb, finalEffect * color.rgb * 2.0, i), color.a);

  return color;
}
`;

// Create UniformGroups
const bgUniforms = new UniformGroup({
  time: { value: 0.0, type: 'f32' },
  resolution: {
    value: [window.innerWidth, window.innerHeight],
    type: 'vec2<f32>',
  },
  mouse: { value: [0.5, 0.5], type: 'vec2<f32>' },
});

const myUniforms = new UniformGroup({
  intensity: { value: 0.5, type: 'f32' },
  time: { value: 0.0, type: 'f32' },
});

let bgFilter: Filter;
let customFilter: Filter;

onMounted(async () => {
  if (!container.value) return;

  // Initialize PixiJS
  await app.init({
    backgroundAlpha: 0, // Let the background shader show through
    resizeTo: window,
    preference: 'webgpu',
    antialias: false,
  });

  // Create background filter
  bgFilter = Filter.from({
    gpu: {
      vertex: {
        source: bgGpuShader,
        entryPoint: 'mainVertex',
      },
      fragment: {
        source: bgGpuShader,
        entryPoint: 'mainFrag',
      },
    },
    resources: {
      bgUniforms,
    },
    padding: 0,
  });

  // Create bunnies filter
  customFilter = Filter.from({
    gpu: {
      vertex: {
        source: gpuShader,
        entryPoint: 'mainVertex',
      },
      fragment: {
        source: gpuShader,
        entryPoint: 'mainFrag',
      },
    },
    resources: {
      myUniforms,
    },
  });

  container.value.appendChild(app.canvas);

  // Create background sprite
  const bg = new Sprite(Texture.WHITE);
  bg.width = app.screen.width;
  bg.height = app.screen.height;
  bg.filters = [bgFilter];
  app.stage.addChild(bg);

  // Set up bunnies container
  bunniesContainer.filters = [customFilter];
  app.stage.addChild(bunniesContainer);

  const texture = await Assets.load('https://pixijs.com/assets/bunny.png');

  const spawnBunny = (x: number, y: number) => {
    const eid = addEntity(world);
    addComponent(world, eid, Position);
    addComponent(world, eid, Velocity);
    addComponent(world, eid, Rotation);
    addComponent(world, eid, Scale);

    Position.x[eid] = x;
    Position.y[eid] = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 1;
    Velocity.x[eid] = Math.cos(angle) * speed;
    Velocity.y[eid] = Math.sin(angle) * speed;
    Rotation.angle[eid] = 0;
    Rotation.angularVelocity[eid] = (Math.random() - 0.5) * 0.1;
    Scale.s[eid] = 0.5 + Math.random() * 0.5;

    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.scale.set(Scale.s[eid]);
    bunniesContainer.addChild(sprite);
    sprites.set(eid, sprite);
    store.bunnyCount++;
  };

  for (let i = 0; i < 50; i++) {
    spawnBunny(
      Math.random() * app.screen.width,
      Math.random() * app.screen.height,
    );
  }

  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;

  app.stage.on('pointerdown', (e) => {
    for (let i = 0; i < store.spawnCount; i++) {
      spawnBunny(e.global.x, e.global.y);
    }
  });

  // Handle resize explicitly to update background sprite and uniforms
  window.addEventListener('resize', () => {
    if (bg) {
      bg.width = app.screen.width;
      bg.height = app.screen.height;
    }
    bgUniforms.uniforms.resolution = [app.screen.width, app.screen.height];
  });

  const movementSystem = (world: World, delta: number) => {
    const ents = query(world, [Position, Velocity, Rotation]);
    const speedMultiplier = store.bunnySpeed;

    for (const eid of ents) {
      Position.x[eid] += Velocity.x[eid] * speedMultiplier * delta;
      Position.y[eid] += Velocity.y[eid] * speedMultiplier * delta;
      Rotation.angle[eid] += Rotation.angularVelocity[eid] * delta;

      if (Position.x[eid] < 0) Position.x[eid] = app.screen.width;
      if (Position.x[eid] > app.screen.width) Position.x[eid] = 0;
      if (Position.y[eid] < 0) Position.y[eid] = app.screen.height;
      if (Position.y[eid] > app.screen.height) Position.y[eid] = 0;
    }
  };

  const collisionSystem = (world: World) => {
    if (!store.showCollisions) return;
    const ents = query(world, [Position, Velocity]);
    const radius = 15;

    for (let i = 0; i < ents.length; i++) {
      const e1 = ents[i];
      for (let j = i + 1; j < ents.length; j++) {
        const e2 = ents[j];
        const dx = Position.x[e1] - Position.x[e2];
        const dy = Position.y[e1] - Position.y[e2];
        const distSq = dx * dx + dy * dy;
        if (distSq < radius * radius * 4) {
          const tempX = Velocity.x[e1];
          const tempY = Velocity.y[e1];
          Velocity.x[e1] = Velocity.x[e2];
          Velocity.y[e1] = Velocity.y[e2];
          Velocity.x[e2] = tempX;
          Velocity.y[e2] = tempY;
        }
      }
    }
  };

  const renderingSystem = (world: World) => {
    const ents = query(world, [Position, Rotation, Scale]);
    for (const eid of ents) {
      const sprite = sprites.get(eid);
      if (sprite) {
        sprite.x = Position.x[eid];
        sprite.y = Position.y[eid];
        sprite.rotation = Rotation.angle[eid];
      }
    }
  };

  let time = 0;
  app.ticker.add((ticker) => {
    const dt = ticker.deltaTime;
    time += 0.05 * dt;

    movementSystem(world, dt);
    collisionSystem(world);
    renderingSystem(world);

    // Update using the stable myUniforms reference
    myUniforms.uniforms.intensity = store.shaderIntensity;
    myUniforms.uniforms.time = time;

    // Update background uniforms
    bgUniforms.uniforms.time = time;
    bgUniforms.uniforms.resolution = [app.screen.width, app.screen.height];

    // Use app.renderer.events.pointer.global directly without manual scaling
    // Pixi's global pointer is already in screen coordinates
    const globalMouse = app.renderer.events.pointer.global;
    if (globalMouse.x >= 0 && globalMouse.y >= 0) {
      bgUniforms.uniforms.mouse = [
        globalMouse.x / app.screen.width,
        globalMouse.y / app.screen.height,
      ];
    }

    // Ensure background sprite covers the screen
    const bg = app.stage.getChildAt(0) as Sprite;
    if (bg) {
      bg.width = app.screen.width;
      bg.height = app.screen.height;
    }
  });
});

onUnmounted(() => {
  app.destroy(true, { children: true, texture: true });
});
</script>

<template>
  <div ref="container" class="pixi-canvas"></div>
</template>

<style scoped>
.pixi-canvas {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}
</style>
