import * as THREE from 'three';

/** A palette used by both the pedestrian and vehicle generators. */
export interface StreetLifePalette {
  skin: readonly THREE.ColorRepresentation[];
  hair: readonly THREE.ColorRepresentation[];
  tops: readonly THREE.ColorRepresentation[];
  bottoms: readonly THREE.ColorRepresentation[];
  shoes: THREE.ColorRepresentation;
  carBodies: readonly THREE.ColorRepresentation[];
  carAccents: readonly THREE.ColorRepresentation[];
  carGlass: THREE.ColorRepresentation;
  carLights: THREE.ColorRepresentation;
  tire: THREE.ColorRepresentation;
}

/** The ten authored color moods available to the scene integration. */
export const STREET_LIFE_PALETTES = {
  sunset: {
    skin: ['#f1bd91', '#d9946d', '#a95f4d'],
    hair: ['#211b24', '#49302b', '#7c4f3c'],
    tops: ['#e86f5e', '#e8b062', '#5a7c91', '#e8d4b7'],
    bottoms: ['#2c394b', '#4e5360', '#6e4c42'],
    shoes: '#20252e',
    carBodies: ['#e86b57', '#e1ad59', '#55778a', '#d9d2bc'],
    carAccents: ['#242a34', '#f2d39e', '#7f4d48'],
    carGlass: '#203646',
    carLights: '#ffe4a7',
    tire: '#16191f',
  },
  lantern: {
    skin: ['#f2c5a3', '#d8916b', '#a95e4b'],
    hair: ['#282027', '#51332a', '#7d4b32'],
    tops: ['#c84e44', '#eea459', '#f4d59b', '#55705e'],
    bottoms: ['#303242', '#57473d', '#253c48'],
    shoes: '#171d23',
    carBodies: ['#c84e44', '#e69c52', '#667d69', '#e7d5ab'],
    carAccents: ['#312b31', '#eed29c', '#9e433c'],
    carGlass: '#263d45',
    carLights: '#fff0bd',
    tire: '#17191c',
  },
  jade: {
    skin: ['#f0c5a1', '#c98365', '#8f5549'],
    hair: ['#1e2930', '#34473f', '#63473a'],
    tops: ['#3d7a6c', '#7da694', '#d1b86b', '#d76857'],
    bottoms: ['#283f42', '#3f5254', '#554548'],
    shoes: '#18252a',
    carBodies: ['#36766a', '#8cab80', '#c9ae68', '#d46656'],
    carAccents: ['#1d3136', '#dbc684', '#854e4b'],
    carGlass: '#1e3b3a',
    carLights: '#ffe6a3',
    tire: '#131a1c',
  },
  plum: {
    skin: ['#f4c6a0', '#d2876e', '#96574e'],
    hair: ['#221d2d', '#493049', '#704339'],
    tops: ['#8b527d', '#c46868', '#daa56b', '#58718a'],
    bottoms: ['#2b2d45', '#4d3d53', '#4d4d58'],
    shoes: '#201d2b',
    carBodies: ['#824b78', '#bd6267', '#d6a066', '#5b718a'],
    carAccents: ['#28223a', '#e5c88f', '#713e57'],
    carGlass: '#25253e',
    carLights: '#ffe0a0',
    tire: '#171622',
  },
  harbor: {
    skin: ['#f2c19a', '#cd8669', '#925548'],
    hair: ['#202830', '#3b3e45', '#68483b'],
    tops: ['#47768b', '#6f9ba4', '#d8b26e', '#da695a'],
    bottoms: ['#273b4b', '#475563', '#5c4d49'],
    shoes: '#1a2631',
    carBodies: ['#46788b', '#719ba2', '#d3ad68', '#d76657'],
    carAccents: ['#202d39', '#e7cd98', '#7e4a4d'],
    carGlass: '#203b4b',
    carLights: '#ffe7a7',
    tire: '#151c23',
  },
  paper: {
    skin: ['#f3c7a1', '#ce896b', '#9a5b4d'],
    hair: ['#2c2524', '#54423a', '#765b47'],
    tops: ['#efe0c1', '#d5bc91', '#a7b5ad', '#d87965'],
    bottoms: ['#4b4b4d', '#6b6255', '#3a4b52'],
    shoes: '#252729',
    carBodies: ['#e8dbc0', '#cfb88a', '#9aada2', '#d67561'],
    carAccents: ['#37383b', '#f0d9a1', '#8c5149'],
    carGlass: '#36434a',
    carLights: '#fff1c4',
    tire: '#1d2022',
  },
  neon: {
    skin: ['#f3c39a', '#d7896b', '#995747'],
    hair: ['#1c2031', '#353553', '#643d4a'],
    tops: ['#e65e72', '#e1b751', '#4aa49a', '#8060b0'],
    bottoms: ['#25283e', '#383c57', '#4f394d'],
    shoes: '#171b2d',
    carBodies: ['#d9576f', '#d4ad48', '#43a69a', '#7659ac'],
    carAccents: ['#192038', '#e8d17a', '#7d344b'],
    carGlass: '#1a2742',
    carLights: '#fff0a2',
    tire: '#101523',
  },
  cobalt: {
    skin: ['#f1bd95', '#ca8064', '#8e5146'],
    hair: ['#1b2436', '#313e55', '#5d463d'],
    tops: ['#3d6db1', '#638fbf', '#dc7860', '#d2b96f'],
    bottoms: ['#263454', '#3c4b66', '#5e4a4b'],
    shoes: '#182135',
    carBodies: ['#3d6fb1', '#5f8db8', '#d8735e', '#cdb36d'],
    carAccents: ['#1b263e', '#dfcc87', '#824549'],
    carGlass: '#1b2e4a',
    carLights: '#ffe9aa',
    tire: '#111a29',
  },
  coral: {
    skin: ['#f2c29b', '#d18468', '#99574a'],
    hair: ['#2b2027', '#55312e', '#754938'],
    tops: ['#e66a5e', '#ef9e62', '#e1cb9a', '#6f8c8a'],
    bottoms: ['#3f3643', '#555252', '#394b4b'],
    shoes: '#22242c',
    carBodies: ['#e4665a', '#e99b5e', '#dcc995', '#6d8b87'],
    carAccents: ['#2d2832', '#f0d297', '#97443f'],
    carGlass: '#29404a',
    carLights: '#ffedb4',
    tire: '#17191e',
  },
  twilight: {
    skin: ['#f0bea0', '#c9816c', '#92594f'],
    hair: ['#1d2230', '#383447', '#61483f'],
    tops: ['#596a9b', '#7e719d', '#c58a79', '#b8aa76'],
    bottoms: ['#2b304b', '#46445c', '#51444c'],
    shoes: '#1d2030',
    carBodies: ['#596b9c', '#7f7096', '#c48775', '#b5a571'],
    carAccents: ['#24283f', '#d9c58b', '#774b50'],
    carGlass: '#232e4a',
    carLights: '#ffe8ae',
    tire: '#131724',
  },
} as const satisfies Record<string, StreetLifePalette>;

export type StreetLifePaletteName = keyof typeof STREET_LIFE_PALETTES;

/** Resolved placement and motion values. Pass a partial value through options.style. */
export interface StreetLifeStyle {
  sidewalkX: readonly [number, number];
  laneX: readonly [number, number];
  minZ: number;
  maxZ: number;
  sidewalkY: number;
  roadY: number;
  pedestrianScale: number;
  carScale: number;
  pedestrianSpeed: number;
  carSpeed: number;
  pedestrianStride: number;
  carLoopPadding: number;
}

export type StreetLifeStyleOptions = Partial<StreetLifeStyle>;

export interface StreetLifeGreetingOptions {
  /** Text rendered in the head-anchored billboard. Defaults to 遥遥领先. */
  text?: string;
  /** Horizontal XZ distance at which a pedestrian can greet the listener. */
  triggerRadius?: number;
  /** How long the billboard remains visible after a greeting. */
  durationSeconds?: number;
  /** Per-pedestrian and global quiet period after a greeting. */
  cooldownSeconds?: number;
  /** Called once when a pedestrian successfully greets the listener. */
  onSpeak?: (pedestrianName: string) => void;
}

export interface StreetLifeOptions {
  /** A stable integer seed makes actor positions, colors, phases, and speeds repeatable. */
  seed?: number;
  /** Defaults to eight pedestrians. The integration can choose another non-negative count. */
  pedestrianCount?: number;
  /** Defaults to five cars, split between two opposing lanes. */
  carCount?: number;
  palette?: StreetLifePaletteName | Partial<StreetLifePalette>;
  style?: StreetLifeStyleOptions;
  greeting?: StreetLifeGreetingOptions;
}

export interface StreetLife {
  readonly root: THREE.Group;
  update(deltaSeconds: number, listenerPosition?: Readonly<THREE.Vector3>): void;
  dispose(): void;
}

export const DEFAULT_STREET_LIFE_STYLE: StreetLifeStyle = {
  // Scene sidewalk slabs are centered at +/-4.65 and run from roughly -34 to 14.
  sidewalkX: [-4.55, 4.55],
  // The road's painted edges are +/-3.28; these centers leave a safe margin.
  laneX: [-1.5, 1.5],
  minZ: -33.35,
  maxZ: 13.35,
  sidewalkY: 0.16,
  roadY: 0.09,
  pedestrianScale: 1,
  carScale: 1,
  pedestrianSpeed: 0.58,
  carSpeed: 1.55,
  pedestrianStride: 0.42,
  carLoopPadding: 1.8,
};

// Keep the object construction entirely deterministic and independent of Math.random().
const makeRandom = (seed: number): (() => number) => {
  let state = (Number.isFinite(seed) ? Math.floor(seed) : 0x5eed1234) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const numberOr = (value: number | undefined, fallback: number): number =>
  value !== undefined && Number.isFinite(value) ? value : fallback;

const tupleOr = (
  value: readonly [number, number] | undefined,
  fallback: readonly [number, number],
): readonly [number, number] => {
  if (value && Number.isFinite(value[0]) && Number.isFinite(value[1])) return [value[0], value[1]];
  return [fallback[0], fallback[1]];
};

const resolveStyle = (input: StreetLifeStyleOptions | undefined): StreetLifeStyle => {
  const minZ = numberOr(input?.minZ, DEFAULT_STREET_LIFE_STYLE.minZ);
  const requestedMaxZ = numberOr(input?.maxZ, DEFAULT_STREET_LIFE_STYLE.maxZ);
  return {
    sidewalkX: tupleOr(input?.sidewalkX, DEFAULT_STREET_LIFE_STYLE.sidewalkX),
    laneX: tupleOr(input?.laneX, DEFAULT_STREET_LIFE_STYLE.laneX),
    minZ,
    maxZ: Math.max(minZ + 0.01, requestedMaxZ),
    sidewalkY: numberOr(input?.sidewalkY, DEFAULT_STREET_LIFE_STYLE.sidewalkY),
    roadY: numberOr(input?.roadY, DEFAULT_STREET_LIFE_STYLE.roadY),
    pedestrianScale: Math.max(0.01, numberOr(input?.pedestrianScale, DEFAULT_STREET_LIFE_STYLE.pedestrianScale)),
    carScale: Math.max(0.01, numberOr(input?.carScale, DEFAULT_STREET_LIFE_STYLE.carScale)),
    pedestrianSpeed: Math.max(0, numberOr(input?.pedestrianSpeed, DEFAULT_STREET_LIFE_STYLE.pedestrianSpeed)),
    carSpeed: Math.max(0, numberOr(input?.carSpeed, DEFAULT_STREET_LIFE_STYLE.carSpeed)),
    pedestrianStride: Math.max(0, numberOr(input?.pedestrianStride, DEFAULT_STREET_LIFE_STYLE.pedestrianStride)),
    carLoopPadding: Math.max(0, numberOr(input?.carLoopPadding, DEFAULT_STREET_LIFE_STYLE.carLoopPadding)),
  };
};

const arrayOr = <T>(value: readonly T[] | undefined, fallback: readonly T[]): readonly T[] =>
  value && value.length > 0 ? value : fallback;

const wrapZ = (value: number, min: number, max: number): number => {
  const length = max - min;
  if (!(length > 0)) return min;
  const offset = value - min;
  return min + ((offset % length) + length) % length;
};

const resolvePalette = (input: StreetLifeOptions['palette']): StreetLifePalette => {
  const base: StreetLifePalette =
    typeof input === 'string' && input in STREET_LIFE_PALETTES
      ? STREET_LIFE_PALETTES[input as StreetLifePaletteName]
      : STREET_LIFE_PALETTES.sunset;
  if (!input || typeof input === 'string') return base;

  return {
    skin: arrayOr(input.skin, base.skin),
    hair: arrayOr(input.hair, base.hair),
    tops: arrayOr(input.tops, base.tops),
    bottoms: arrayOr(input.bottoms, base.bottoms),
    shoes: input.shoes ?? base.shoes,
    carBodies: arrayOr(input.carBodies, base.carBodies),
    carAccents: arrayOr(input.carAccents, base.carAccents),
    carGlass: input.carGlass ?? base.carGlass,
    carLights: input.carLights ?? base.carLights,
    tire: input.tire ?? base.tire,
  };
};

interface ResolvedGreeting {
  text: string;
  triggerRadius: number;
  durationSeconds: number;
  cooldownSeconds: number;
  onSpeak?: (pedestrianName: string) => void;
}

const resolveGreeting = (input: StreetLifeGreetingOptions | undefined): ResolvedGreeting => ({
  text: input?.text ?? '遥遥领先',
  triggerRadius: Math.max(0.01, numberOr(input?.triggerRadius, 2.8)),
  durationSeconds: Math.max(0.01, numberOr(input?.durationSeconds, 2.6)),
  cooldownSeconds: Math.max(0, numberOr(input?.cooldownSeconds, 4.5)),
  onSpeak: input?.onSpeak,
});

interface GreetingResources {
  text: string;
  texture: THREE.Texture;
  material: THREE.SpriteMaterial;
}

const drawRoundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void => {
  const right = x + width;
  const bottom = y + height;
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(right - radius, y);
  context.arcTo(right, y, right, y + radius, radius);
  context.lineTo(right, bottom - radius);
  context.arcTo(right, bottom, right - radius, bottom, radius);
  context.lineTo(x + radius, bottom);
  context.arcTo(x, bottom, x, bottom - radius, radius);
  context.lineTo(x, y + radius);
  context.arcTo(x, y, x + radius, y, radius);
  context.closePath();
};

const makeGreetingResources = (text: string): GreetingResources => {
  let texture: THREE.Texture;
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    let context: CanvasRenderingContext2D | null = null;
    try {
      context = canvas.getContext('2d');
    } catch {
      // A DOM shim may expose canvas elements without a 2D implementation.
    }
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      drawRoundedRect(context, 8, 8, 496, 102, 24);
      context.fillStyle = 'rgba(14, 23, 31, 0.94)';
      context.fill();
      context.strokeStyle = '#ffd47e';
      context.lineWidth = 5;
      context.stroke();
      context.beginPath();
      context.moveTo(238, 108);
      context.lineTo(256, 126);
      context.lineTo(274, 108);
      context.closePath();
      context.fillStyle = 'rgba(14, 23, 31, 0.94)';
      context.fill();
      context.strokeStyle = '#ffd47e';
      context.stroke();
      context.fillStyle = '#fff3cf';
      context.font = '700 48px "PingFang SC", "Microsoft YaHei", sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, 256, 61);
    }
    texture = new THREE.CanvasTexture(canvas);
  } else {
    // Vitest/SSR has no DOM canvas. Keep the same CanvasTexture contract with
    // a dimensioned placeholder; the browser path above supplies the pixels.
    texture = new THREE.CanvasTexture({ width: 512, height: 128 } as HTMLCanvasElement);
  }
  texture.name = 'street-life-greeting-texture';
  texture.userData.text = text;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    color: '#ffffff',
    transparent: true,
    depthWrite: false,
    depthTest: true,
    opacity: 0.98,
  });
  material.name = 'street-life-greeting-material';
  return { text, texture, material };
};

const pick = <T>(random: () => number, values: readonly T[]): T => values[Math.floor(random() * values.length) % values.length];

const markShadow = <T extends THREE.Object3D>(object: T): T => {
  if (object instanceof THREE.Mesh) {
    object.castShadow = true;
    object.receiveShadow = true;
  }
  return object;
};

interface GeometrySet {
  pedestrianTorso: THREE.BufferGeometry;
  pedestrianHips: THREE.BufferGeometry;
  pedestrianLimb: THREE.BufferGeometry;
  pedestrianFoot: THREE.BufferGeometry;
  pedestrianHand: THREE.BufferGeometry;
  pedestrianHead: THREE.BufferGeometry;
  pedestrianHair: THREE.BufferGeometry;
  pedestrianEye: THREE.BufferGeometry;
  carBody: THREE.BufferGeometry;
  carCabin: THREE.BufferGeometry;
  carWindow: THREE.BufferGeometry;
  carBumper: THREE.BufferGeometry;
  carWheel: THREE.BufferGeometry;
  carLight: THREE.BufferGeometry;
  carSmartLight: THREE.BufferGeometry;
}

const makeGeometries = (): GeometrySet => ({
  pedestrianTorso: new THREE.BoxGeometry(0.32, 0.54, 0.22),
  pedestrianHips: new THREE.BoxGeometry(0.29, 0.18, 0.21),
  pedestrianLimb: new THREE.BoxGeometry(0.14, 0.46, 0.14),
  pedestrianFoot: new THREE.BoxGeometry(0.16, 0.1, 0.25),
  pedestrianHand: new THREE.SphereGeometry(0.085, 6, 4),
  pedestrianHead: new THREE.DodecahedronGeometry(0.205, 0),
  pedestrianHair: new THREE.SphereGeometry(0.218, 8, 4, 0, Math.PI * 2, 0, Math.PI * 0.55),
  pedestrianEye: new THREE.BoxGeometry(0.065, 0.035, 0.025),
  carBody: new THREE.BoxGeometry(1.12, 0.34, 2.1),
  carCabin: new THREE.BoxGeometry(0.84, 0.25, 1.03),
  carWindow: new THREE.BoxGeometry(0.7, 0.13, 0.72),
  carBumper: new THREE.BoxGeometry(0.95, 0.1, 0.12),
  carWheel: new THREE.CylinderGeometry(0.18, 0.18, 0.1, 8),
  carLight: new THREE.BoxGeometry(0.18, 0.08, 0.045),
  carSmartLight: new THREE.BoxGeometry(0.2, 0.075, 0.12),
});

interface MaterialRegistry {
  standard(kind: string, color: THREE.ColorRepresentation, roughness: number, metalness?: number): THREE.MeshStandardMaterial;
  emissive(
    kind: string,
    color: THREE.ColorRepresentation,
    emissive: THREE.ColorRepresentation,
    emissiveIntensity?: number,
  ): THREE.MeshStandardMaterial;
  values: THREE.Material[];
}

const colorKey = (color: THREE.ColorRepresentation): string =>
  color instanceof THREE.Color ? color.getHexString() : String(color);

const makeMaterials = (): MaterialRegistry => {
  const cache = new Map<string, THREE.MeshStandardMaterial>();
  const values: THREE.Material[] = [];

  const standard = (
    kind: string,
    color: THREE.ColorRepresentation,
    roughness: number,
    metalness = 0,
  ): THREE.MeshStandardMaterial => {
    const key = `standard:${kind}:${colorKey(color)}:${roughness}:${metalness}`;
    const cached = cache.get(key);
    if (cached) return cached;
    const material = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    cache.set(key, material);
    values.push(material);
    return material;
  };

  const emissive = (
    kind: string,
    color: THREE.ColorRepresentation,
    emissiveColor: THREE.ColorRepresentation,
    emissiveIntensity = 1.25,
  ): THREE.MeshStandardMaterial => {
    const key = `emissive:${kind}:${colorKey(color)}:${colorKey(emissiveColor)}:${emissiveIntensity}`;
    const cached = cache.get(key);
    if (cached) return cached;
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: emissiveColor,
      emissiveIntensity,
      roughness: 0.32,
      metalness: 0.08,
    });
    cache.set(key, material);
    values.push(material);
    return material;
  };

  return { standard, emissive, values };
};

interface PedestrianActor {
  root: THREE.Group;
  upper: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  phase: number;
  gaitRate: number;
  direction: number;
  speed: number;
  subtitle: THREE.Sprite;
  wasNearby: boolean;
  greetingRemaining: number;
  cooldownRemaining: number;
}

interface CarActor {
  root: THREE.Group;
  wheels: readonly THREE.Mesh[];
  direction: number;
  speed: number;
}

const addPedestrianMesh = (
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  scale = 1,
): THREE.Mesh => {
  const mesh = markShadow(new THREE.Mesh(geometry, material));
  mesh.position.set(x, y, z);
  mesh.scale.setScalar(scale);
  parent.add(mesh);
  return mesh;
};

const makePedestrian = (
  index: number,
  count: number,
  random: () => number,
  palette: StreetLifePalette,
  style: StreetLifeStyle,
  geometries: GeometrySet,
  materials: MaterialRegistry,
  greetingResources: GreetingResources,
  pedestrianRoot: THREE.Group,
): PedestrianActor => {
  const direction = index % 2 === 0 ? 1 : -1;
  const side = index % 2;
  const sideCount = Math.max(1, Math.ceil((count - side) / 2));
  const sideSlot = Math.floor(index / 2);
  const slot = (sideSlot + 0.3 + random() * 0.4) / sideCount;
  const root = new THREE.Group();
  root.name = `Pedestrian-${index + 1}`;
  root.position.set(
    style.sidewalkX[side] + (random() - 0.5) * 0.38,
    style.sidewalkY,
    style.minZ + slot * (style.maxZ - style.minZ),
  );
  root.rotation.y = direction > 0 ? 0 : Math.PI;
  const scale = style.pedestrianScale * (0.88 + random() * 0.24);
  root.scale.setScalar(scale);

  const upper = new THREE.Group();
  upper.name = 'upper-body';
  root.add(upper);

  const skin = materials.standard('skin', pick(random, palette.skin), 0.9);
  const hair = materials.standard('hair', pick(random, palette.hair), 0.92);
  const top = materials.standard('top', pick(random, palette.tops), 0.82);
  const bottom = materials.standard('bottom', pick(random, palette.bottoms), 0.9);
  const shoes = materials.standard('shoes', palette.shoes, 0.92);
  const eye = materials.standard('eye', '#171b21', 0.48, 0.05);

  addPedestrianMesh(upper, geometries.pedestrianTorso, top, 0, 0.94, 0);
  addPedestrianMesh(upper, geometries.pedestrianHips, bottom, 0, 0.64, 0);

  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.09, 0.52, 0);
  leftLeg.name = 'left-leg';
  root.add(leftLeg);
  addPedestrianMesh(leftLeg, geometries.pedestrianLimb, bottom, 0, -0.23, 0);
  addPedestrianMesh(leftLeg, geometries.pedestrianFoot, shoes, 0, -0.49, 0.065);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.09, 0.52, 0);
  rightLeg.name = 'right-leg';
  root.add(rightLeg);
  addPedestrianMesh(rightLeg, geometries.pedestrianLimb, bottom, 0, -0.23, 0);
  addPedestrianMesh(rightLeg, geometries.pedestrianFoot, shoes, 0, -0.49, 0.065);

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.205, 1.13, 0);
  leftArm.name = 'left-arm';
  upper.add(leftArm);
  addPedestrianMesh(leftArm, geometries.pedestrianLimb, top, 0, -0.23, 0);
  addPedestrianMesh(leftArm, geometries.pedestrianHand, skin, 0, -0.5, 0);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.205, 1.13, 0);
  rightArm.name = 'right-arm';
  upper.add(rightArm);
  addPedestrianMesh(rightArm, geometries.pedestrianLimb, top, 0, -0.23, 0);
  addPedestrianMesh(rightArm, geometries.pedestrianHand, skin, 0, -0.5, 0);

  const head = addPedestrianMesh(upper, geometries.pedestrianHead, skin, 0, 1.37, 0);
  head.name = 'head';
  head.rotation.y = (random() - 0.5) * 0.18;
  addPedestrianMesh(upper, geometries.pedestrianHair, hair, 0, 1.44, 0);
  // A tiny front panel makes the walking direction readable at street scale.
  addPedestrianMesh(upper, geometries.pedestrianEye, eye, 0, 1.38, 0.19);

  const subtitle = new THREE.Sprite(greetingResources.material);
  subtitle.name = 'pedestrian-subtitle';
  subtitle.position.set(0, 0.28, 0);
  subtitle.scale.set(0.92, 0.25, 1);
  subtitle.center.set(0.5, 0);
  subtitle.userData.text = greetingResources.text;
  subtitle.visible = false;
  head.add(subtitle);

  pedestrianRoot.add(root);
  return {
    root,
    upper,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    phase: random() * Math.PI * 2,
    gaitRate: 5.8 + random() * 1.4,
    direction,
    speed: style.pedestrianSpeed * (0.82 + random() * 0.3),
    subtitle,
    wasNearby: false,
    greetingRemaining: 0,
    cooldownRemaining: 0,
  };
};

const addCarMesh = (
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  rotationZ = 0,
): THREE.Mesh => {
  const mesh = markShadow(new THREE.Mesh(geometry, material));
  mesh.position.set(x, y, z);
  mesh.rotation.z = rotationZ;
  parent.add(mesh);
  return mesh;
};

const makeCar = (
  index: number,
  count: number,
  random: () => number,
  palette: StreetLifePalette,
  style: StreetLifeStyle,
  geometries: GeometrySet,
  materials: MaterialRegistry,
  carRoot: THREE.Group,
): CarActor => {
  const lane = index % 2;
  const direction = lane === 0 ? 1 : -1;
  const root = new THREE.Group();
  root.name = `Car-${index + 1}`;
  const loopMin = style.minZ - style.carLoopPadding;
  const loopMax = style.maxZ + style.carLoopPadding;
  const loopLength = Math.max(0.001, loopMax - loopMin);
  const slot = (index + 0.5) / Math.max(1, count);
  const slotJitter = (random() - 0.5) * Math.min(0.12, 0.6 / Math.max(1, count));
  root.position.set(
    style.laneX[lane],
    style.roadY,
    loopMin + (slot + slotJitter) * loopLength,
  );
  // Keep every starting position inside the loop even if a caller requests many cars.
  root.position.z = wrapZ(root.position.z, loopMin, loopMax);
  root.rotation.y = direction > 0 ? 0 : Math.PI;
  root.scale.setScalar(style.carScale * (0.91 + random() * 0.18));

  const body = materials.standard('car-body', pick(random, palette.carBodies), 0.56, 0.14);
  const accent = materials.standard('car-accent', pick(random, palette.carAccents), 0.48, 0.2);
  const glass = materials.standard('car-glass', palette.carGlass, 0.22, 0.28);
  const tire = materials.standard('tire', palette.tire, 0.98);
  const lights = materials.emissive('car-light', palette.carLights, palette.carLights);
  const smartLightMaterial = materials.emissive(
    'smart-drive-blue-light',
    '#1d8dff',
    '#0064ff',
    2.4,
  );

  addCarMesh(root, geometries.carBody, body, 0, 0.38, 0);
  addCarMesh(root, geometries.carCabin, accent, 0, 0.66, -0.04);
  addCarMesh(root, geometries.carWindow, glass, 0, 0.72, 0.03);
  const smartLight = addCarMesh(root, geometries.carSmartLight, smartLightMaterial, 0, 0.86, 0.28);
  smartLight.name = 'smart-drive-blue-light';
  smartLight.userData.role = 'smart-drive-blue-light';
  smartLight.visible = true;
  addCarMesh(root, geometries.carBumper, accent, 0, 0.3, 1.07);
  addCarMesh(root, geometries.carBumper, accent, 0, 0.3, -1.07);
  addCarMesh(root, geometries.carLight, lights, -0.34, 0.43, 1.075);
  addCarMesh(root, geometries.carLight, lights, 0.34, 0.43, 1.075);

  const wheels: THREE.Mesh[] = [];
  for (const x of [-0.59, 0.59]) {
    for (const z of [-0.67, 0.67]) {
      wheels.push(addCarMesh(root, geometries.carWheel, tire, x, 0.2, z, Math.PI / 2));
    }
  }

  carRoot.add(root);
  return {
    root,
    wheels,
    direction,
    speed: style.carSpeed * (0.86 + random() * 0.24),
  };
};

/**
 * Create the living traffic layer for the authored straight street.
 *
 * The returned root is intentionally not added to a scene, so the caller can
 * choose its insertion point and update it from the existing render loop:
 *
 *   const life = createStreetLife({ palette: 'lantern', seed: 7 });
 *   scene.add(life.root);
 *   life.update(deltaSeconds);
 */
export const createStreetLife = (options: StreetLifeOptions = {}): StreetLife => {
  const style = resolveStyle(options.style);
  const palette = resolvePalette(options.palette);
  const greeting = resolveGreeting(options.greeting);
  const greetingResources = makeGreetingResources(greeting.text);
  const random = makeRandom(options.seed ?? 0x5eed1234);
  const geometries = makeGeometries();
  const materials = makeMaterials();
  const pedestrians = new THREE.Group();
  pedestrians.name = 'Pedestrians';
  const cars = new THREE.Group();
  cars.name = 'Cars';
  const root = new THREE.Group();
  root.name = 'StreetLife';
  root.add(pedestrians, cars);

  const pedestrianCount = Math.max(0, Math.floor(numberOr(options.pedestrianCount, 8)));
  const carCount = Math.max(0, Math.floor(numberOr(options.carCount, 5)));
  const pedestrianActors: PedestrianActor[] = [];
  const carActors: CarActor[] = [];

  for (let index = 0; index < pedestrianCount; index += 1) {
    pedestrianActors.push(
      makePedestrian(
        index,
        pedestrianCount,
        random,
        palette,
        style,
        geometries,
        materials,
        greetingResources,
        pedestrians,
      ),
    );
  }
  for (let index = 0; index < carCount; index += 1) {
    carActors.push(makeCar(index, carCount, random, palette, style, geometries, materials, cars));
  }

  let disposed = false;
  let globalGreetingCooldown = 0;
  const update = (deltaSeconds: number, listenerPosition?: Readonly<THREE.Vector3>): void => {
    if (disposed || !Number.isFinite(deltaSeconds) || deltaSeconds < 0) return;
    const elapsed = deltaSeconds;
    const delta = Math.min(deltaSeconds, 0.1);
    const loopMin = style.minZ - style.carLoopPadding;
    const loopMax = style.maxZ + style.carLoopPadding;
    if (globalGreetingCooldown > 0) {
      globalGreetingCooldown = Math.max(0, globalGreetingCooldown - elapsed);
    }
    const listenerIsValid =
      listenerPosition !== undefined &&
      Number.isFinite(listenerPosition.x) &&
      Number.isFinite(listenerPosition.z);
    const listenerX = listenerIsValid ? listenerPosition.x : 0;
    const listenerZ = listenerIsValid ? listenerPosition.z : 0;
    const triggerRadiusSquared = greeting.triggerRadius * greeting.triggerRadius;

    for (let index = 0; index < pedestrianActors.length; index += 1) {
      const actor = pedestrianActors[index];
      actor.phase += actor.gaitRate * delta;
      if (actor.phase >= Math.PI * 2) actor.phase -= Math.PI * 2;
      const gait = Math.sin(actor.phase);
      actor.leftLeg.rotation.x = gait * style.pedestrianStride;
      actor.rightLeg.rotation.x = -gait * style.pedestrianStride;
      actor.leftArm.rotation.x = -gait * style.pedestrianStride * 0.72;
      actor.rightArm.rotation.x = gait * style.pedestrianStride * 0.72;
      actor.upper.position.y = Math.abs(gait) * 0.018;
      actor.root.position.z = wrapZ(
        actor.root.position.z + actor.direction * actor.speed * delta,
        style.minZ,
        style.maxZ,
      );
      if (actor.greetingRemaining > 0) {
        actor.greetingRemaining = Math.max(0, actor.greetingRemaining - elapsed);
        if (actor.greetingRemaining === 0) actor.subtitle.visible = false;
      }
      if (actor.cooldownRemaining > 0) {
        actor.cooldownRemaining = Math.max(0, actor.cooldownRemaining - elapsed);
      }
      if (listenerIsValid) {
        const deltaX = actor.root.position.x - listenerX;
        const deltaZ = actor.root.position.z - listenerZ;
        const isNearby = deltaX * deltaX + deltaZ * deltaZ <= triggerRadiusSquared;
        if (!isNearby) {
          actor.wasNearby = false;
        } else {
          if (!actor.wasNearby && actor.cooldownRemaining <= 0 && globalGreetingCooldown <= 0) {
            actor.subtitle.visible = true;
            actor.greetingRemaining = greeting.durationSeconds;
            actor.cooldownRemaining = greeting.cooldownSeconds;
            globalGreetingCooldown = greeting.durationSeconds + greeting.cooldownSeconds;
            greeting.onSpeak?.(actor.root.name);
          }
          actor.wasNearby = true;
        }
      }
    }

    for (let index = 0; index < carActors.length; index += 1) {
      const actor = carActors[index];
      actor.root.position.z = wrapZ(
        actor.root.position.z + actor.direction * actor.speed * delta,
        loopMin,
        loopMax,
      );
      const wheelRotation = actor.direction * actor.speed * delta / 0.18;
      for (let wheelIndex = 0; wheelIndex < actor.wheels.length; wheelIndex += 1) {
        // CylinderGeometry's local Y axis is turned onto the car's X axle above.
        // Rotate around that local axle so wheels roll instead of wobbling.
        actor.wheels[wheelIndex].rotateY(-wheelRotation);
      }
    }
  };

  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    root.removeFromParent();
    root.clear();
    for (const geometry of Object.values(geometries)) geometry.dispose();
    for (const material of materials.values) material.dispose();
    greetingResources.texture.dispose();
    greetingResources.material.dispose();
    pedestrianActors.length = 0;
    carActors.length = 0;
  };

  return { root, update, dispose };
};

export const STREET_LIFE_THEMES = STREET_LIFE_PALETTES;
