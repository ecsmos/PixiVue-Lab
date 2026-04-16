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
const leavesContainer = new Container();

// 2. Custom WebGPU Shader (WGSL) for Forest Background
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
    let t = bgUniforms.time * 0.05;
    let screenUV = (position.xy - gfu.uGlobalFrame.xy) / gfu.uGlobalFrame.zw;
    let st = screenUV * 2.0 - 1.0;
    let aspect = bgUniforms.resolution.x / bgUniforms.resolution.y;
    let p = st * vec2<f32>(aspect, 1.0);
    
    let m = (bgUniforms.mouse * 2.0 - 1.0) * vec2<f32>(aspect, 1.0);
    let distToMouse = length(p - m);
    let mouseInfluence = smoothstep(0.6, 0.0, distToMouse);
    
    // Forest colors: deep green to moss green
    var color = mix(vec3<f32>(0.05, 0.1, 0.02), vec3<f32>(0.1, 0.2, 0.05), p.y * 0.5 + 0.5);
    
    // Sunlight rays / shafts
    let rayAngle = 0.5;
    let rayPos = p.x * cos(rayAngle) + p.y * sin(rayAngle);
    let rays = sin(rayPos * 10.0 + t * 2.0) * sin(rayPos * 7.0 - t * 1.5) * 0.5 + 0.5;
    color += vec3<f32>(0.2, 0.2, 0.05) * pow(rays, 3.0) * (p.y + 1.0);

    // Leaves layers (particles/noise)
    for(var i: f32 = 1.0; i < 4.0; i += 1.0) {
        let parallax = m * 0.02 * i;
        let uv_layer = p * (1.0 + i * 0.3) + vec2<f32>(t * 0.2 * i, sin(t * 0.1 * i)) - parallax;
        let grid = floor(uv_layer * 8.0);
        let f = fract(uv_layer * 8.0) - 0.5;
        
        let h = hash(grid + i * 567.89);
        if (h > 0.96) {
            let dist = length(f);
            let sway = sin(bgUniforms.time * 2.0 + h * 20.0) * 0.1;
            let leafBrightness = (0.005 / (dist + 0.01)) * (1.0 + mouseInfluence);
            color += vec3<f32>(0.1, 0.3, 0.05) * leafBrightness;
        }
    }
    
    // Soft glow around mouse (sunlight through canopy)
    color += vec3<f32>(0.3, 0.3, 0.1) * exp(-distToMouse * 3.0) * 0.4;
    
    return vec4<f32>(color, 1.0);
}
`;

// 3. Custom WebGPU Shader (WGSL) for leaves
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

  // Leaf effect: swaying colors + subsurface scattering glow
  let st = uv * 2.0 - 1.0;
  
  // Pulsing green/yellow
  let pulse = sin(t * 1.5 + uv.x * 5.0) * 0.1 + 0.9;
  let leafColor = vec3<f32>(0.4, 0.8, 0.1) * pulse;
  
  // Sunlight highlight
  let sunPos = vec2<f32>(0.5, -0.5);
  let highlight = pow(max(0.0, dot(st, sunPos)), 3.0);
  let finalEffect = leafColor + vec3<f32>(0.5, 0.5, 0.1) * highlight;

  color = vec4<f32>(mix(color.rgb, finalEffect * color.rgb * 1.5, i), color.a);

  return color;
}
`;

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

  await app.init({
    backgroundAlpha: 0,
    resizeTo: window,
    preference: 'webgpu',
    antialias: false,
  });

  bgFilter = Filter.from({
    gpu: {
      vertex: { source: bgGpuShader, entryPoint: 'mainVertex' },
      fragment: { source: bgGpuShader, entryPoint: 'mainFrag' },
    },
    resources: { bgUniforms },
    padding: 0,
  });

  customFilter = Filter.from({
    gpu: {
      vertex: { source: gpuShader, entryPoint: 'mainVertex' },
      fragment: { source: gpuShader, entryPoint: 'mainFrag' },
    },
    resources: { myUniforms },
  });

  container.value.appendChild(app.canvas);

  const bg = new Sprite(Texture.WHITE);
  bg.width = app.screen.width;
  bg.height = app.screen.height;
  bg.filters = [bgFilter];
  app.stage.addChild(bg);

  leavesContainer.filters = [customFilter];
  app.stage.addChild(leavesContainer);

  // Using flowerTop as a "leaf" equivalent
  const texture = await Assets.load('https://pixijs.com/assets/flowerTop.png');

  const spawnLeaf = (x: number, y: number) => {
    const eid = addEntity(world);
    addComponent(world, eid, Position);
    addComponent(world, eid, Velocity);
    addComponent(world, eid, Rotation);
    addComponent(world, eid, Scale);

    Position.x[eid] = x;
    Position.y[eid] = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 1.5 + 0.5; // Slower than bunnies
    Velocity.x[eid] = Math.cos(angle) * speed;
    Velocity.y[eid] = Math.sin(angle) * speed;
    Rotation.angle[eid] = Math.random() * Math.PI * 2;
    Rotation.angularVelocity[eid] = (Math.random() - 0.5) * 0.05;
    Scale.s[eid] = 0.3 + Math.random() * 0.4;

    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.scale.set(Scale.s[eid]);
    leavesContainer.addChild(sprite);
    sprites.set(eid, sprite);
    store.leafCount++;
  };

  for (let i = 0; i < 30; i++) {
    spawnLeaf(
      Math.random() * app.screen.width,
      Math.random() * app.screen.height,
    );
  }

  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;

  app.stage.on('pointerdown', (e) => {
    for (let i = 0; i < store.spawnCount; i++) {
      spawnLeaf(e.global.x, e.global.y);
    }
  });

  window.addEventListener('resize', () => {
    if (bg) {
      bg.width = app.screen.width;
      bg.height = app.screen.height;
    }
    bgUniforms.uniforms.resolution = [app.screen.width, app.screen.height];
  });

  const movementSystem = (world: World, delta: number) => {
    const ents = query(world, [Position, Velocity, Rotation]);
    const speedMultiplier = store.leafSpeed;

    for (const eid of ents) {
      // Add a bit of "wind" sway
      Velocity.x[eid] += Math.sin(time * 0.5 + Position.y[eid] * 0.01) * 0.01;
      
      Position.x[eid] += Velocity.x[eid] * speedMultiplier * delta;
      Position.y[eid] += Velocity.y[eid] * speedMultiplier * delta;
      Rotation.angle[eid] += Rotation.angularVelocity[eid] * delta;

      if (Position.x[eid] < -50) Position.x[eid] = app.screen.width + 50;
      if (Position.x[eid] > app.screen.width + 50) Position.x[eid] = -50;
      if (Position.y[eid] < -50) Position.y[eid] = app.screen.height + 50;
      if (Position.y[eid] > app.screen.height + 50) Position.y[eid] = -50;
    }
  };

  const collisionSystem = (world: World) => {
    if (!store.showCollisions) return;
    const ents = query(world, [Position, Velocity]);
    const radius = 12;

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

    myUniforms.uniforms.intensity = store.shaderIntensity;
    myUniforms.uniforms.time = time;
    bgUniforms.uniforms.time = time;
    bgUniforms.uniforms.resolution = [app.screen.width, app.screen.height];

    const globalMouse = app.renderer.events.pointer.global;
    if (globalMouse.x >= 0 && globalMouse.y >= 0) {
      bgUniforms.uniforms.mouse = [
        globalMouse.x / app.screen.width,
        globalMouse.y / app.screen.height,
      ];
    }

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
