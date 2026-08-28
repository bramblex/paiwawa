import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { GAME_LEVELS, getLevel, type LevelDefinition, type Vector3Tuple } from './levels';
import {
  ProgressiveLevelLoader,
  type LevelLoadProgressListener,
  type LevelLoadState,
} from './progressive-level-loader';

export interface StreetLandmarks {
  toiletFace: THREE.Mesh;
  arrowTip: THREE.Object3D;
  waweiFace: THREE.Mesh;
  startPosition: THREE.Vector3;
  startLookTarget: THREE.Vector3;
  solutionPosition: THREE.Vector3;
}

export interface StreetSceneOptions {
  onProgress?: (ratio: number, currentAsset: string) => void;
  backgroundLevelDelayMs?: number;
}

export interface StreetSceneRuntime {
  readonly root: THREE.Group;
  readonly landmarks: StreetLandmarks;
  readonly activeLevelIndex: number;
  getLevelLoadState(index: number): LevelLoadState;
  ensureLevel(index: number, onProgress?: LevelLoadProgressListener): Promise<void>;
  preloadRemaining(): void;
  setLevel(index: number): StreetLandmarks;
  update(deltaSeconds: number): void;
  dispose(): void;
}

interface SkyUniforms {
  [uniform: string]: { value: THREE.Color };
  topColor: { value: THREE.Color };
  horizonColor: { value: THREE.Color };
  bottomColor: { value: THREE.Color };
}

interface DecorRuntime {
  root: THREE.Group;
  update?: (deltaSeconds: number) => void;
}

interface TargetBuildingRuntime {
  root: THREE.Object3D;
  signPosition: THREE.Vector3;
}

interface LevelSceneRuntime {
  target: TargetBuildingRuntime;
  decor: DecorRuntime;
}

const ROAD_MODEL_URL = 'assets/models/roads/road-straight.glb';
const BACKGROUND_TOWER_URL = 'assets/models/buildings/building-skyscraper-b.glb';
const BACKGROUND_BLOCK_URL = 'assets/models/buildings/building-f.glb';
const TOILET_TEXTURE_URL = 'assets/signs/public-toilet-450m-front-texture.png';
const WAWA_TEXTURE_URL = 'assets/signs/wawa-bamboo-cicada-lightbox-front.png';
const CAMERA_HEIGHT = 1.65;

const tupleToVector = (value: Vector3Tuple): THREE.Vector3 =>
  new THREE.Vector3(value[0], value[1], value[2]);

const safeLevelIndex = (index: number): number => {
  const finiteIndex = Number.isFinite(index) ? Math.trunc(index) : 0;
  return THREE.MathUtils.clamp(finiteIndex, 0, GAME_LEVELS.length - 1);
};

const markShadows = (root: THREE.Object3D): void => {
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.castShadow = true;
    child.receiveShadow = true;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
      if ('map' in material && material.map instanceof THREE.Texture) {
        material.map.colorSpace = THREE.SRGBColorSpace;
      }
    }
  });
};

const makeSky = (): { mesh: THREE.Mesh; material: THREE.ShaderMaterial; uniforms: SkyUniforms } => {
  const uniforms: SkyUniforms = {
    topColor: { value: new THREE.Color('#17243a') },
    horizonColor: { value: new THREE.Color('#d98662') },
    bottomColor: { value: new THREE.Color('#f4c58f') },
  };
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms,
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      uniform vec3 bottomColor;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y;
        vec3 low = mix(bottomColor, horizonColor, smoothstep(-0.18, 0.16, h));
        vec3 color = mix(low, topColor, smoothstep(0.02, 0.72, h));
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(110, 32, 18), material);
  mesh.name = 'LevelSky';
  mesh.frustumCulled = false;
  return { mesh, material, uniforms };
};

const makeRoadMarkings = (
  parent: THREE.Object3D,
): { centerMaterial: THREE.MeshStandardMaterial; edgeMaterial: THREE.MeshStandardMaterial } => {
  const centerMaterial = new THREE.MeshStandardMaterial({
    color: '#e8dcbf',
    roughness: 0.82,
    metalness: 0,
  });

  for (let z = 10; z >= -34; z -= 5.2) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.018, 2.5), centerMaterial);
    dash.position.set(0, 0.09, z);
    dash.receiveShadow = true;
    parent.add(dash);
  }

  const edgeMaterial = new THREE.MeshStandardMaterial({ color: '#d7c9ad', roughness: 0.9 });
  for (const x of [-3.28, 3.28]) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.015, 48), edgeMaterial);
    line.position.set(x, 0.085, -10);
    line.receiveShadow = true;
    parent.add(line);
  }
  return { centerMaterial, edgeMaterial };
};

const addStreetLight = (
  parent: THREE.Object3D,
  x: number,
  z: number,
  faceRoad: number,
): void => {
  const metal = new THREE.MeshStandardMaterial({ color: '#25313b', roughness: 0.42, metalness: 0.55 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.065, 3.8, 10), metal);
  pole.position.set(x, 1.9, z);
  pole.castShadow = true;
  parent.add(pole);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.055, 0.055), metal);
  arm.position.set(x + faceRoad * 0.29, 3.73, z);
  arm.castShadow = true;
  parent.add(arm);

  const bulbMaterial = new THREE.MeshBasicMaterial({ color: '#ffd39b' });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 8), bulbMaterial);
  bulb.position.set(x + faceRoad * 0.58, 3.65, z);
  parent.add(bulb);

  const glow = new THREE.PointLight('#ffc47f', 1.15, 6.5, 2);
  glow.position.copy(bulb.position);
  parent.add(glow);
};

const addTree = (parent: THREE.Object3D, x: number, z: number, scale: number): void => {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13 * scale, 0.18 * scale, 1.5 * scale, 8),
    new THREE.MeshStandardMaterial({ color: '#5b4335', roughness: 1 }),
  );
  trunk.position.set(x, 0.75 * scale, z);
  trunk.castShadow = true;
  parent.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.95 * scale, 1),
    new THREE.MeshStandardMaterial({ color: '#304e45', roughness: 0.96 }),
  );
  crown.scale.set(0.88, 1.2, 0.88);
  crown.position.set(x, 2.05 * scale, z);
  crown.castShadow = true;
  parent.add(crown);
};

const addBox = (
  parent: THREE.Object3D,
  size: Vector3Tuple,
  position: Vector3Tuple,
  material: THREE.Material,
  rotationY = 0,
): THREE.Mesh => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.rotation.y = rotationY;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
};

const createToiletSignTexture = (anisotropy: number): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 320;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to create the distant toilet sign texture.');

  context.fillStyle = '#0c4b8e';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#f8f6ee';
  context.lineWidth = 18;
  context.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
  context.fillStyle = '#f8f6ee';
  context.beginPath();
  context.arc(104, 86, 24, 0, Math.PI * 2);
  context.arc(222, 86, 24, 0, Math.PI * 2);
  context.fill();
  context.fillRect(77, 120, 54, 92);
  context.fillRect(84, 205, 17, 64);
  context.fillRect(108, 205, 17, 64);
  context.beginPath();
  context.moveTo(222, 118);
  context.lineTo(168, 226);
  context.lineTo(276, 226);
  context.closePath();
  context.fill();
  context.fillRect(195, 206, 17, 63);
  context.fillRect(230, 206, 17, 63);
  context.fillRect(318, 48, 5, 224);
  context.font = '800 86px "PingFang SC", "Microsoft YaHei", sans-serif';
  context.textBaseline = 'alphabetic';
  context.fillText('公共厕所', 372, 140);
  context.font = '700 48px Arial, sans-serif';
  context.letterSpacing = '5px';
  context.fillText('PUBLIC TOILET', 375, 226);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
  return texture;
};

const addDistantToilet = (parent: THREE.Object3D, renderer: THREE.WebGLRenderer): THREE.Group => {
  const group = new THREE.Group();
  group.name = 'DistantPublicToilet';
  group.position.set(-8.95, 0, -31.8);

  const wallMaterial = new THREE.MeshStandardMaterial({ color: '#d7d0c0', roughness: 0.9 });
  const trimMaterial = new THREE.MeshStandardMaterial({ color: '#234967', roughness: 0.64, metalness: 0.08 });
  const doorMaterial = new THREE.MeshStandardMaterial({ color: '#183247', roughness: 0.7 });
  const body = addBox(group, [5.5, 2.55, 3.3], [0, 1.39, 0], wallMaterial);
  body.receiveShadow = true;
  addBox(group, [5.9, 0.25, 3.7], [0, 2.79, 0], trimMaterial);

  for (const x of [-1.12, 1.12]) {
    addBox(group, [1.22, 1.88, 0.09], [x, 1.06, 1.69], doorMaterial);
    const handle = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 10, 8),
      new THREE.MeshStandardMaterial({ color: '#d9bc79', metalness: 0.65, roughness: 0.28 }),
    );
    handle.position.set(x + (x < 0 ? 0.38 : -0.38), 1.1, 1.75);
    group.add(handle);
  }

  const signTexture = createToiletSignTexture(renderer.capabilities.getMaxAnisotropy());
  const signWidth = 3.75;
  const signHeight = signWidth * (320 / 1024);
  addBox(
    group,
    [signWidth + 0.12, signHeight + 0.12, 0.14],
    [0, 2.3, 1.72],
    new THREE.MeshStandardMaterial({ color: '#17344f', metalness: 0.38, roughness: 0.4 }),
  );
  const signFace = new THREE.Mesh(
    new THREE.PlaneGeometry(signWidth, signHeight),
    new THREE.MeshStandardMaterial({
      map: signTexture,
      emissive: '#dceaff',
      emissiveMap: signTexture,
      emissiveIntensity: 0.72,
      roughness: 0.5,
      side: THREE.DoubleSide,
    }),
  );
  signFace.position.set(0, 2.3, 1.796);
  group.add(signFace);
  addBox(group, [4.25, 0.12, 0.7], [0, 2.92, 1.7], trimMaterial);
  for (const x of [-1.55, 1.55]) {
    addBox(group, [0.06, 0.45, 0.06], [x, 2.67, 1.79], trimMaterial);
  }
  const porch = addBox(
    group,
    [5.8, 0.12, 1.5],
    [0, 0.09, 2.08],
    new THREE.MeshStandardMaterial({ color: '#b8ae9d', roughness: 0.96 }),
  );
  porch.receiveShadow = true;
  const signLight = new THREE.PointLight('#bcd9ff', 1.2, 7, 2);
  signLight.position.set(0, 2.65, 2.2);
  group.add(signLight);
  parent.add(group);
  return group;
};

const placeBuilding = (
  parent: THREE.Object3D,
  source: THREE.Object3D,
  position: THREE.Vector3,
  scale: number,
  rotationY = 0,
): { root: THREE.Object3D; bounds: THREE.Box3 } => {
  const root = source.clone(true);
  root.scale.setScalar(scale);
  root.rotation.y = rotationY;
  root.position.copy(position);
  root.updateMatrixWorld(true);
  const initialBounds = new THREE.Box3().setFromObject(root);
  root.position.y += 0.12 - initialBounds.min.y;
  root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(root);
  markShadows(root);
  parent.add(root);
  return { root, bounds };
};

const makeSunsetDecor = (): DecorRuntime => {
  const root = new THREE.Group();
  root.name = 'Decor-Sunset';
  addTree(root, -5.15, -9.5, 0.9);
  addTree(root, -12.2, -19.5, 0.92);
  addTree(root, 5.05, -3.5, 0.78);
  const benchWood = new THREE.MeshStandardMaterial({ color: '#82533d', roughness: 0.82 });
  const benchMetal = new THREE.MeshStandardMaterial({ color: '#292f37', roughness: 0.46, metalness: 0.55 });
  for (const z of [-5.8, -18.5]) {
    addBox(root, [1.75, 0.12, 0.42], [-5.15, 0.65, z], benchWood);
    addBox(root, [1.75, 0.62, 0.1], [-5.15, 0.97, z - 0.18], benchWood);
    addBox(root, [0.08, 0.56, 0.34], [-5.82, 0.37, z], benchMetal);
    addBox(root, [0.08, 0.56, 0.34], [-4.48, 0.37, z], benchMetal);
  }
  return { root };
};

const makeRainDecor = (): DecorRuntime => {
  const root = new THREE.Group();
  root.name = 'Decor-Rain';
  const concrete = new THREE.MeshStandardMaterial({ color: '#354755', roughness: 0.94 });
  addBox(root, [1.05, 5.7, 1.1], [-5.7, 2.85, -14], concrete);
  addBox(root, [1.05, 5.7, 1.1], [5.7, 2.85, -14], concrete);
  addBox(root, [13.2, 0.55, 3.2], [0, 5.45, -14], concrete);

  const puddleMaterial = new THREE.MeshStandardMaterial({
    color: '#83b6cc',
    roughness: 0.16,
    metalness: 0.18,
    transparent: true,
    opacity: 0.54,
  });
  for (const [x, z, sx, sz] of [
    [-4.7, -4.5, 1.8, 0.55],
    [4.75, -10.5, 1.3, 0.42],
    [-1.8, -23, 1.7, 0.38],
  ] as const) {
    const puddle = new THREE.Mesh(new THREE.CircleGeometry(1, 26), puddleMaterial);
    puddle.rotation.x = -Math.PI / 2;
    puddle.scale.set(sx, sz, 1);
    puddle.position.set(x, 0.172, z);
    root.add(puddle);
  }

  const dropCount = 360;
  const rainPositions = new Float32Array(dropCount * 6);
  for (let index = 0; index < dropCount; index += 1) {
    const offset = index * 6;
    const hashX = ((index * 47) % 359) / 358;
    const hashY = ((index * 83) % 353) / 352;
    const hashZ = ((index * 131) % 349) / 348;
    const x = -11 + hashX * 22;
    const y = 0.4 + hashY * 10;
    const z = -40 + hashZ * 58;
    rainPositions[offset] = x;
    rainPositions[offset + 1] = y;
    rainPositions[offset + 2] = z;
    rainPositions[offset + 3] = x - 0.055;
    rainPositions[offset + 4] = y - 0.55;
    rainPositions[offset + 5] = z + 0.11;
  }
  const rainGeometry = new THREE.BufferGeometry();
  const rainAttribute = new THREE.BufferAttribute(rainPositions, 3);
  rainGeometry.setAttribute('position', rainAttribute);
  const rain = new THREE.LineSegments(
    rainGeometry,
    new THREE.LineBasicMaterial({ color: '#b9def1', transparent: true, opacity: 0.42, depthWrite: false }),
  );
  rain.name = 'AnimatedRain';
  rain.frustumCulled = false;
  root.add(rain);

  const update = (deltaSeconds: number): void => {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return;
    const drop = Math.min(deltaSeconds, 0.1) * 9.5;
    for (let index = 0; index < rainPositions.length; index += 6) {
      rainPositions[index + 1] -= drop;
      rainPositions[index + 4] -= drop;
      if (rainPositions[index + 1] < 0.1) {
        rainPositions[index + 1] += 10.5;
        rainPositions[index + 4] += 10.5;
      }
    }
    rainAttribute.needsUpdate = true;
  };
  return { root, update };
};

const makeConstructionDecor = (): DecorRuntime => {
  const root = new THREE.Group();
  root.name = 'Decor-Construction';
  const warning = new THREE.MeshStandardMaterial({ color: '#eaa52d', roughness: 0.7 });
  const dark = new THREE.MeshStandardMaterial({ color: '#34363a', roughness: 0.58, metalness: 0.28 });
  const scaffold = new THREE.MeshStandardMaterial({ color: '#74808a', roughness: 0.42, metalness: 0.62 });
  for (const z of [-12, -16, -20]) {
    addBox(root, [3.2, 0.16, 0.16], [-5.05, 0.78, z], warning, -0.04);
    addBox(root, [0.12, 1.36, 0.12], [-6.35, 0.68, z], dark);
    addBox(root, [0.12, 1.36, 0.12], [-3.75, 0.68, z], dark);
  }
  for (const x of [2.5, 5.2, 7.4]) {
    addBox(root, [0.11, 6.2, 0.11], [x, 3.1, -25], scaffold);
  }
  for (const y of [1.1, 3.1, 5.1]) {
    addBox(root, [5.1, 0.1, 0.1], [4.95, y, -25], scaffold);
  }
  for (const [x, z] of [[-3.85, -8.2], [-5.1, -10.1], [3.7, -18.2]] as const) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.72, 10), warning);
    cone.position.set(x, 0.52, z);
    cone.castShadow = true;
    root.add(cone);
  }
  return { root };
};

const makeHarborDecor = (): DecorRuntime => {
  const root = new THREE.Group();
  root.name = 'Decor-Harbor';
  const waterMaterial = new THREE.MeshStandardMaterial({
    color: '#315c65',
    roughness: 0.24,
    metalness: 0.16,
    transparent: true,
    opacity: 0.92,
  });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(24, 58), waterMaterial);
  water.rotation.x = -Math.PI / 2;
  water.position.set(-17.6, 0.02, -12);
  root.add(water);

  const containerColors = ['#b84f43', '#39758a', '#b98235'];
  for (let index = 0; index < 6; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const material = new THREE.MeshStandardMaterial({
      color: containerColors[index % containerColors.length],
      roughness: 0.7,
      metalness: 0.18,
    });
    const x = side < 0 ? -8.2 : 8.2;
    const z = -7 - Math.floor(index / 2) * 8.2;
    addBox(root, [4.2, 2.25, 2.2], [x, 1.28, z], material, side * 0.03);
    for (const stripeX of [-1.55, -0.75, 0, 0.75, 1.55]) {
      addBox(root, [0.055, 1.9, 2.23], [x + stripeX, 1.28, z], new THREE.MeshStandardMaterial({
        color: '#26373c',
        roughness: 0.7,
        transparent: true,
        opacity: 0.36,
      }));
    }
  }
  const bollardMaterial = new THREE.MeshStandardMaterial({ color: '#192a2e', roughness: 0.52, metalness: 0.5 });
  for (const z of [-2, -10, -18, -26]) {
    const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 0.72, 10), bollardMaterial);
    bollard.position.set(-6.35, 0.46, z);
    root.add(bollard);
  }
  return { root };
};

const makeNeonDecor = (): DecorRuntime => {
  const root = new THREE.Group();
  root.name = 'Decor-Neon';
  const frame = new THREE.MeshStandardMaterial({ color: '#171526', roughness: 0.38, metalness: 0.58 });
  const cyan = new THREE.MeshBasicMaterial({ color: '#52d9ef' });
  const magenta = new THREE.MeshBasicMaterial({ color: '#ff4d99' });
  for (const [z, color, lightColor] of [
    [-4, cyan, '#48dff3'],
    [-14, magenta, '#ff4e9b'],
    [-24, cyan, '#48dff3'],
  ] as const) {
    addBox(root, [0.16, 5.3, 0.18], [-5.6, 2.65, z], frame);
    addBox(root, [0.16, 5.3, 0.18], [5.6, 2.65, z], frame);
    addBox(root, [11.35, 0.16, 0.18], [0, 5.2, z], frame);
    addBox(root, [0.055, 4.8, 0.2], [-5.47, 2.65, z + 0.02], color);
    addBox(root, [0.055, 4.8, 0.2], [5.47, 2.65, z + 0.02], color);
    addBox(root, [10.85, 0.055, 0.2], [0, 5.07, z + 0.02], color);
    const light = new THREE.PointLight(lightColor, 1.45, 7.5, 2);
    light.position.set(0, 3.4, z + 0.8);
    root.add(light);
  }
  for (const [x, z, color] of [
    [-9.6, -11, magenta],
    [7.8, -18, cyan],
    [-9.5, -28, cyan],
  ] as const) {
    addBox(root, [2.4, 3.6, 0.45], [x, 2.05, z], frame);
    addBox(root, [1.95, 2.9, 0.48], [x, 2.05, z + 0.03], color);
  }
  return { root };
};

const addPalm = (
  parent: THREE.Object3D,
  x: number,
  z: number,
  scale: number,
  trunkMaterial: THREE.Material,
  leafMaterial: THREE.Material,
): void => {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 2.8, 8), trunkMaterial);
  trunk.position.set(x, 1.4 * scale, z);
  trunk.scale.setScalar(scale);
  trunk.rotation.z = x < 0 ? -0.06 : 0.06;
  trunk.castShadow = true;
  parent.add(trunk);
  for (let index = 0; index < 6; index += 1) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.8, 5), leafMaterial);
    leaf.position.set(x, 2.92 * scale, z);
    leaf.scale.setScalar(scale);
    leaf.rotation.set(Math.PI / 2, index * Math.PI / 3, 0.36 * Math.sin(index));
    leaf.castShadow = true;
    parent.add(leaf);
  }
};

const makeSeasideDecor = (): DecorRuntime => {
  const root = new THREE.Group();
  root.name = 'Decor-Seaside';
  const waterMaterial = new THREE.MeshStandardMaterial({
    color: '#35a8bd',
    roughness: 0.26,
    metalness: 0.08,
  });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(28, 70), waterMaterial);
  water.rotation.x = -Math.PI / 2;
  water.position.set(18.5, 0.035, -12);
  root.add(water);
  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(8.8, 64),
    new THREE.MeshStandardMaterial({ color: '#e8ca84', roughness: 0.98 }),
  );
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(8.9, 0.055, -12);
  sand.receiveShadow = true;
  root.add(sand);

  const trunk = new THREE.MeshStandardMaterial({ color: '#896342', roughness: 0.9 });
  const leaf = new THREE.MeshStandardMaterial({ color: '#2f8062', roughness: 0.86 });
  for (const [x, z, scale] of [
    [6.4, -3, 0.9], [9.6, -10.5, 1.05], [6.9, -19, 0.84], [10.4, -27, 1.1], [-7.2, -24, 0.82],
  ] as const) addPalm(root, x, z, scale, trunk, leaf);

  const umbrellaColors = ['#ef765f', '#f3e3b1', '#4b9bb1'];
  for (const [index, z] of [-6, -17, -27].entries()) {
    addBox(root, [0.06, 1.8, 0.06], [7.8, 0.9, z], trunk);
    const canopy = new THREE.Mesh(
      new THREE.ConeGeometry(1.05, 0.38, 12),
      new THREE.MeshStandardMaterial({ color: umbrellaColors[index], roughness: 0.82 }),
    );
    canopy.position.set(7.8, 1.92, z);
    canopy.castShadow = true;
    root.add(canopy);
  }
  const waveMaterial = new THREE.MeshBasicMaterial({ color: '#d8fbff', transparent: true, opacity: 0.55 });
  const waves: THREE.Mesh[] = [];
  for (let index = 0; index < 7; index += 1) {
    const wave = addBox(root, [5.5, 0.025, 0.055], [13.1 + (index % 2) * 1.2, 0.07, 7 - index * 7.5], waveMaterial);
    waves.push(wave);
  }
  let elapsed = 0;
  return {
    root,
    update: (deltaSeconds) => {
      elapsed += Math.min(0.1, Math.max(0, deltaSeconds));
      waves.forEach((wave, index) => {
        wave.position.x = 13.1 + (index % 2) * 1.2 + Math.sin(elapsed * 0.7 + index) * 0.32;
      });
    },
  };
};

const makeDesertDecor = (): DecorRuntime => {
  const root = new THREE.Group();
  root.name = 'Decor-Desert';
  const duneMaterials = ['#d99b50', '#e7b968', '#c9843f'].map((color) =>
    new THREE.MeshStandardMaterial({ color, roughness: 1 }));
  for (let index = 0; index < 12; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const dune = new THREE.Mesh(new THREE.SphereGeometry(2.8, 12, 7), duneMaterials[index % duneMaterials.length]);
    dune.scale.set(1.35 + (index % 3) * 0.28, 0.36 + (index % 2) * 0.1, 1.1);
    dune.position.set(side * (8.4 + (index % 3) * 2.8), -0.2, 8 - Math.floor(index / 2) * 8.2);
    dune.castShadow = true;
    dune.receiveShadow = true;
    root.add(dune);
  }
  const cactusMaterial = new THREE.MeshStandardMaterial({ color: '#40755a', roughness: 0.96 });
  for (const [x, z, scale] of [
    [-7.2, 2, 0.9], [7.6, -5, 1.1], [-8.5, -14, 0.8], [8.3, -22, 1.25], [-7.5, -29, 1],
  ] as const) {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.29, 2.4, 8), cactusMaterial);
    stem.position.set(x, 1.2 * scale, z);
    stem.scale.setScalar(scale);
    stem.castShadow = true;
    root.add(stem);
    addBox(root, [0.9 * scale, 0.22 * scale, 0.22 * scale], [x + 0.28 * scale, 1.4 * scale, z], cactusMaterial);
    addBox(root, [0.22 * scale, 0.85 * scale, 0.22 * scale], [x + 0.68 * scale, 1.72 * scale, z], cactusMaterial);
  }
  const rockMaterial = new THREE.MeshStandardMaterial({ color: '#934f35', roughness: 0.94 });
  for (const [x, z, scale] of [[-11, -8, 2.4], [12, -18, 3], [-10, -32, 2.2]] as const) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(scale, 0), rockMaterial);
    rock.scale.set(1.2, 1.8, 0.72);
    rock.position.set(x, scale * 0.9, z);
    rock.castShadow = true;
    root.add(rock);
  }
  return { root };
};

const addPine = (
  parent: THREE.Object3D,
  x: number,
  z: number,
  scale: number,
  trunkMaterial: THREE.Material,
  needleMaterial: THREE.Material,
): void => {
  addBox(parent, [0.2 * scale, 1.2 * scale, 0.2 * scale], [x, 0.6 * scale, z], trunkMaterial);
  for (let tier = 0; tier < 3; tier += 1) {
    const crown = new THREE.Mesh(
      new THREE.ConeGeometry((1.05 - tier * 0.18) * scale, 1.6 * scale, 8),
      needleMaterial,
    );
    crown.position.set(x, (1.25 + tier * 0.62) * scale, z);
    crown.castShadow = true;
    parent.add(crown);
  }
};

const makeSnowDecor = (): DecorRuntime => {
  const root = new THREE.Group();
  root.name = 'Decor-Snow';
  const mountain = new THREE.MeshStandardMaterial({ color: '#748ba0', roughness: 0.92 });
  const snow = new THREE.MeshStandardMaterial({ color: '#eef6f7', roughness: 0.96 });
  for (const [x, z, radius, height] of [
    [-18, -38, 9, 18], [-8, -43, 7, 14], [10, -42, 8, 16], [20, -39, 10, 20],
  ] as const) {
    const base = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 7), mountain);
    base.position.set(x, height / 2 - 0.2, z);
    root.add(base);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.47, height * 0.38, 7), snow);
    cap.position.set(x, height * 0.81, z);
    root.add(cap);
  }
  const trunk = new THREE.MeshStandardMaterial({ color: '#554535', roughness: 0.92 });
  const needles = new THREE.MeshStandardMaterial({ color: '#2f5f5c', roughness: 0.95 });
  for (const [x, z, scale] of [
    [-7, 4, 0.8], [7.2, 0, 0.95], [-8.2, -9, 1.15], [8.1, -14, 0.88], [-7.4, -24, 1], [8.4, -29, 1.18],
  ] as const) addPine(root, x, z, scale, trunk, needles);

  const snowPositions = new Float32Array(180 * 3);
  for (let index = 0; index < 180; index += 1) {
    snowPositions[index * 3] = -11 + ((index * 47) % 211) / 210 * 22;
    snowPositions[index * 3 + 1] = 0.4 + ((index * 83) % 197) / 196 * 9;
    snowPositions[index * 3 + 2] = -38 + ((index * 131) % 223) / 222 * 52;
  }
  const snowGeometry = new THREE.BufferGeometry();
  const snowAttribute = new THREE.BufferAttribute(snowPositions, 3);
  snowGeometry.setAttribute('position', snowAttribute);
  const flakes = new THREE.Points(
    snowGeometry,
    new THREE.PointsMaterial({ color: '#ffffff', size: 0.085, transparent: true, opacity: 0.78, depthWrite: false }),
  );
  flakes.frustumCulled = false;
  root.add(flakes);
  return {
    root,
    update: (deltaSeconds) => {
      const drop = Math.min(0.1, Math.max(0, deltaSeconds)) * 0.62;
      for (let index = 1; index < snowPositions.length; index += 3) {
        snowPositions[index] -= drop;
        if (snowPositions[index] < 0.15) snowPositions[index] += 9.2;
      }
      snowAttribute.needsUpdate = true;
    },
  };
};

const makeAutumnDecor = (): DecorRuntime => {
  const root = new THREE.Group();
  root.name = 'Decor-Autumn';
  const trunk = new THREE.MeshStandardMaterial({ color: '#5b3f2b', roughness: 0.96 });
  const leafMaterials = ['#c65432', '#df8432', '#e6aa3f', '#8f3f2f'].map((color) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.9 }));
  for (let index = 0; index < 14; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const x = side * (6.7 + (index % 3) * 1.15);
    const z = 8 - Math.floor(index / 2) * 6.4;
    addBox(root, [0.22, 2.2, 0.22], [x, 1.1, z], trunk);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25 + (index % 2) * 0.18, 1), leafMaterials[index % 4]);
    crown.scale.set(0.9, 1.18, 0.86);
    crown.position.set(x, 2.75, z);
    crown.castShadow = true;
    root.add(crown);
  }
  const fence = new THREE.MeshStandardMaterial({ color: '#7d5a3d', roughness: 0.9 });
  for (const side of [-1, 1]) {
    for (let z = 8; z >= -34; z -= 3.2) {
      addBox(root, [0.12, 1.05, 0.12], [side * 6.15, 0.53, z], fence);
    }
    addBox(root, [0.12, 0.12, 43], [side * 6.15, 0.44, -13], fence);
    addBox(root, [0.12, 0.12, 43], [side * 6.15, 0.88, -13], fence);
  }
  return { root };
};

const makeCanyonDecor = (): DecorRuntime => {
  const root = new THREE.Group();
  root.name = 'Decor-Canyon';
  const rockMaterials = ['#8f4634', '#aa5d3e', '#6f392f'].map((color) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.98 }));
  for (let index = 0; index < 18; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const scale = 2.4 + (index % 4) * 0.65;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(scale, 0), rockMaterials[index % 3]);
    rock.scale.set(0.9, 1.45, 0.72);
    rock.rotation.set(0.08 * (index % 3), 0.22 * index, 0.04 * side);
    rock.position.set(side * (9.1 + (index % 3) * 1.5), scale * 1.1, 9 - Math.floor(index / 2) * 5.6);
    rock.castShadow = true;
    rock.receiveShadow = true;
    root.add(rock);
  }
  const archMaterial = new THREE.MeshStandardMaterial({ color: '#9f5239', roughness: 0.98 });
  addBox(root, [2.1, 7.4, 3.2], [-5.4, 3.7, -30], archMaterial, -0.08);
  addBox(root, [2.1, 7.4, 3.2], [5.4, 3.7, -30], archMaterial, 0.08);
  addBox(root, [10.4, 2.2, 3.2], [0, 7.1, -30], archMaterial);
  for (const [x, z, scale] of [[-6.6, -4, 0.8], [6.8, -12, 1], [-6.9, -20, 0.72]] as const) {
    const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(scale, 0), rockMaterials[2]);
    boulder.position.set(x, scale * 0.72, z);
    boulder.castShadow = true;
    root.add(boulder);
  }
  return { root };
};

const addSecurityGuard = (
  parent: THREE.Object3D,
  level: LevelDefinition,
): THREE.Group => {
  const guard = new THREE.Group();
  guard.name = `SecurityGuard-${level.id}`;
  const navy = new THREE.MeshStandardMaterial({ color: '#17345f', roughness: 0.68 });
  const darkNavy = new THREE.MeshStandardMaterial({ color: '#0c1d38', roughness: 0.62 });
  const reflectiveBlue = new THREE.MeshStandardMaterial({ color: '#88bfdc', roughness: 0.45, metalness: 0.12 });
  const skin = new THREE.MeshStandardMaterial({ color: '#c89570', roughness: 0.88 });

  addBox(guard, [0.74, 0.92, 0.38], [0, 1.42, 0], navy);
  addBox(guard, [0.76, 0.1, 0.4], [0, 1.47, 0.205], reflectiveBlue);
  addBox(guard, [0.66, 0.32, 0.34], [0, 0.82, 0], darkNavy);
  for (const side of [-1, 1]) {
    addBox(guard, [0.23, 0.86, 0.25], [side * 0.19, 0.37, 0], darkNavy, side * 0.02);
    const arm = addBox(guard, [0.2, 0.82, 0.22], [side * 0.49, 1.37, 0], navy, side * -0.1);
    arm.rotation.z = side * -0.13;
  }
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.29, 1), skin);
  head.scale.set(0.86, 1.08, 0.88);
  head.position.set(0, 2.12, 0);
  head.castShadow = true;
  guard.add(head);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.34, 0.2, 10), darkNavy);
  cap.position.set(0, 2.4, 0);
  cap.castShadow = true;
  guard.add(cap);
  addBox(guard, [0.45, 0.05, 0.24], [0, 2.31, 0.17], darkNavy);

  const toiletSignPosition = tupleToVector(level.toiletSign.position);
  guard.position.set(toiletSignPosition.x, 0.16, toiletSignPosition.z + 0.65);
  guard.lookAt(0, guard.position.y, toiletSignPosition.z + 0.65);
  guard.scale.setScalar(0.6);
  parent.add(guard);
  return guard;
};

const makeDecor = (level: LevelDefinition): DecorRuntime => {
  switch (level.themeKey) {
    case 'sunset': return makeSunsetDecor();
    case 'rain': return makeRainDecor();
    case 'construction': return makeConstructionDecor();
    case 'harbor': return makeHarborDecor();
    case 'neon': return makeNeonDecor();
    case 'seaside': return makeSeasideDecor();
    case 'desert': return makeDesertDecor();
    case 'snow': return makeSnowDecor();
    case 'autumn': return makeAutumnDecor();
    case 'canyon': return makeCanyonDecor();
  }
};

const disposeMaterialTextures = (material: THREE.Material, textures: Set<THREE.Texture>): void => {
  for (const value of Object.values(material)) {
    if (value instanceof THREE.Texture) textures.add(value);
  }
  if (!(material instanceof THREE.ShaderMaterial)) return;
  for (const uniform of Object.values(material.uniforms)) {
    if (uniform.value instanceof THREE.Texture) textures.add(uniform.value);
  }
};

export async function createStreetScene(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  options: StreetSceneOptions = {},
): Promise<StreetSceneRuntime> {
  const initialManager = new THREE.LoadingManager();
  initialManager.onProgress = (url, loaded, total) => {
    options.onProgress?.(total > 0 ? loaded / total : 0, url.split('/').at(-1) ?? url);
  };

  const initialGltfLoader = new GLTFLoader(initialManager);
  const backgroundGltfLoader = new GLTFLoader();
  const textureLoader = new THREE.TextureLoader(initialManager);
  const initialModelUrls = [...new Set([
    ROAD_MODEL_URL,
    BACKGROUND_TOWER_URL,
    BACKGROUND_BLOCK_URL,
    GAME_LEVELS[0].targetBuilding.modelUrl,
  ])];
  const [modelEntries, toiletTexture, waweiTexture] = await Promise.all([
    Promise.all(initialModelUrls.map(async (url) => [url, (await initialGltfLoader.loadAsync(url)).scene] as const)),
    textureLoader.loadAsync(TOILET_TEXTURE_URL),
    textureLoader.loadAsync(WAWA_TEXTURE_URL),
  ]);
  const modelSources = new Map<string, THREE.Object3D>(modelEntries);
  const modelPromises = new Map<string, Promise<THREE.Object3D>>();
  const modelSource = (url: string): THREE.Object3D => {
    const source = modelSources.get(url);
    if (!source) throw new Error(`Missing loaded street model: ${url}`);
    return source;
  };
  const loadModelSource = (
    url: string,
    onProgress?: LevelLoadProgressListener,
  ): Promise<THREE.Object3D> => {
    const loaded = modelSources.get(url);
    if (loaded) {
      onProgress?.({ ratio: 1, label: url.split('/').at(-1) ?? url });
      return Promise.resolve(loaded);
    }
    const inFlight = modelPromises.get(url);
    if (inFlight) return inFlight;
    const label = url.split('/').at(-1) ?? url;
    const promise = backgroundGltfLoader.loadAsync(url, (event) => {
      const ratio = event.lengthComputable && event.total > 0 ? event.loaded / event.total : 0;
      onProgress?.({ ratio, label });
    })
      .then((gltf) => {
        if (disposed) throw new Error('Street scene was disposed while a level asset was loading.');
        modelSources.set(url, gltf.scene);
        modelPromises.delete(url);
        onProgress?.({ ratio: 1, label });
        return gltf.scene;
      })
      .catch((error: unknown) => {
        modelPromises.delete(url);
        throw error;
      });
    modelPromises.set(url, promise);
    return promise;
  };

  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  for (const texture of [toiletTexture, waweiTexture]) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = maxAnisotropy;
  }

  const previousFog = scene.fog;
  const root = new THREE.Group();
  root.name = 'StreetSceneRuntime';

  const sky = makeSky();
  root.add(sky.mesh);
  const levelFog = new THREE.FogExp2('#ad876e', 0.017);

  const hemisphere = new THREE.HemisphereLight('#aec7ef', '#3d3029', 2.35);
  root.add(hemisphere);
  const sun = new THREE.DirectionalLight('#ffd2a0', 3.1);
  sun.position.set(-8, 14, 9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -22;
  sun.shadow.camera.right = 22;
  sun.shadow.camera.top = 25;
  sun.shadow.camera.bottom = -10;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 60;
  sun.shadow.bias = -0.00012;
  root.add(sun);

  const groundMaterial = new THREE.MeshStandardMaterial({ color: '#59665f', roughness: 1 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.035, -8);
  ground.receiveShadow = true;
  root.add(ground);

  const roadRoot = new THREE.Group();
  roadRoot.name = 'CommonRoad';
  const roadMaterials = new Set<THREE.Material>();
  for (let index = 0; index < 7; index += 1) {
    const road = modelSource(ROAD_MODEL_URL).clone(true);
    road.scale.set(7.15, 1, 7.15);
    road.position.set(0, 0.01, 10.4 - index * 7.12);
    markShadows(road);
    road.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.receiveShadow = true;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) roadMaterials.add(material);
    });
    roadRoot.add(road);
  }
  const roadMarkings = makeRoadMarkings(roadRoot);
  root.add(roadRoot);

  const sidewalkMaterial = new THREE.MeshStandardMaterial({ color: '#a79d8d', roughness: 0.94 });
  const curbMaterial = new THREE.MeshStandardMaterial({ color: '#d2c7b5', roughness: 0.9 });
  for (const x of [-4.65, 4.65]) {
    const sidewalk = addBox(root, [2.6, 0.16, 48], [x, 0.07, -10], sidewalkMaterial);
    sidewalk.receiveShadow = true;
    addBox(root, [0.18, 0.24, 48], [Math.sign(x) * 3.42, 0.11, -10], curbMaterial);
  }

  const commonBackground = new THREE.Group();
  commonBackground.name = 'CommonBackground';
  placeBuilding(
    commonBackground,
    modelSource(BACKGROUND_TOWER_URL),
    new THREE.Vector3(10.8, 0, -29),
    1.65,
    Math.PI / 2,
  );
  placeBuilding(
    commonBackground,
    modelSource(BACKGROUND_BLOCK_URL),
    new THREE.Vector3(-14, 0, -23),
    2.4,
    -Math.PI / 2,
  );
  for (const [x, z, side] of [
    [-4.05, -5, 1],
    [-4.05, -15, 1],
    [4.05, -8, -1],
    [4.05, -27, -1],
  ] as const) {
    addStreetLight(commonBackground, x, z, side);
  }
  root.add(commonBackground);
  addDistantToilet(root, renderer);

  const buildLevelScene = (level: LevelDefinition): LevelSceneRuntime => {
    const levelRoot = new THREE.Group();
    levelRoot.name = `TargetBuilding-${level.id}`;
    const placed = placeBuilding(
      levelRoot,
      modelSource(level.targetBuilding.modelUrl),
      tupleToVector(level.targetBuilding.position),
      level.targetBuilding.scale,
      level.targetBuilding.rotationY,
    );
    const center = placed.bounds.getCenter(new THREE.Vector3());
    const signPosition = new THREE.Vector3(center.x, placed.bounds.max.y + 1.34, placed.bounds.max.z + 0.14);
    levelRoot.visible = false;
    root.add(levelRoot);
    const decor = makeDecor(level);
    if (level.number >= 6) addSecurityGuard(decor.root, level);
    decor.root.visible = false;
    root.add(decor.root);
    return { target: { root: levelRoot, signPosition }, decor };
  };

  const waweiWidth = 2.3;
  const waweiHeight = 2.3;
  const waweiGroup = new THREE.Group();
  waweiGroup.name = 'ActiveWawaRoofSign';
  const waweiBack = new THREE.Mesh(
    new RoundedBoxGeometry(waweiWidth + 0.16, waweiHeight + 0.16, 0.18, 4, 0.06),
    new THREE.MeshStandardMaterial({ color: '#181419', metalness: 0.5, roughness: 0.28 }),
  );
  waweiBack.castShadow = true;
  waweiGroup.add(waweiBack);
  const waweiFace = new THREE.Mesh(
    new THREE.PlaneGeometry(waweiWidth, waweiHeight),
    new THREE.MeshStandardMaterial({
      map: waweiTexture,
      emissive: '#fff3ed',
      emissiveMap: waweiTexture,
      emissiveIntensity: 1.5,
      roughness: 0.38,
      metalness: 0.08,
      side: THREE.DoubleSide,
    }),
  );
  waweiFace.name = 'WawaSignFace';
  waweiFace.position.z = 0.101;
  waweiFace.renderOrder = 2;
  waweiGroup.add(waweiFace);
  const supportMaterial = new THREE.MeshStandardMaterial({ color: '#312a2b', metalness: 0.55, roughness: 0.4 });
  for (const offsetX of [-0.68, 0.68]) {
    addBox(waweiGroup, [0.09, 0.9, 0.09], [offsetX, -1.53, -0.02], supportMaterial);
  }
  const waweiGlow = new THREE.PointLight('#ffb0a4', 1.8, 7, 2);
  waweiGlow.position.set(0, 0, 0.55);
  waweiGroup.add(waweiGlow);
  root.add(waweiGroup);

  const toiletGroup = new THREE.Group();
  toiletGroup.name = 'ActivePublicToiletSign';
  const toiletWidth = 4.35;
  const toiletHeight = toiletWidth * (483 / 1843);
  const toiletY = 4.25;
  const toiletBack = new THREE.Mesh(
    new RoundedBoxGeometry(toiletWidth + 0.08, toiletHeight + 0.08, 0.16, 4, 0.06),
    new THREE.MeshStandardMaterial({ color: '#0b447e', metalness: 0.32, roughness: 0.38 }),
  );
  toiletBack.position.set(0, toiletY, -0.005);
  toiletBack.castShadow = true;
  toiletGroup.add(toiletBack);
  const toiletFace = new THREE.Mesh(
    new THREE.PlaneGeometry(toiletWidth, toiletHeight),
    new THREE.MeshBasicMaterial({
      map: toiletTexture,
      transparent: true,
      alphaTest: 0.04,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
  );
  toiletFace.name = 'PublicToiletSignFace';
  toiletFace.position.set(0, toiletY, 0.082);
  toiletFace.renderOrder = 3;
  toiletGroup.add(toiletFace);
  const arrowTip = new THREE.Object3D();
  arrowTip.name = 'PublicToiletArrowTip';
  arrowTip.position.set(toiletWidth * 0.363, -toiletHeight * 0.29, 0.012);
  toiletFace.add(arrowTip);
  const poleMaterial = new THREE.MeshStandardMaterial({ color: '#34434d', metalness: 0.65, roughness: 0.34 });
  const toiletPole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 3.68, 12), poleMaterial);
  toiletPole.position.set(-1.83, 1.84, -0.07);
  toiletPole.castShadow = true;
  toiletGroup.add(toiletPole);
  root.add(toiletGroup);

  const landmarks: StreetLandmarks = {
    toiletFace,
    arrowTip,
    waweiFace,
    startPosition: new THREE.Vector3(),
    startLookTarget: new THREE.Vector3(),
    solutionPosition: new THREE.Vector3(),
  };

  let activeLevelIndex = 0;
  let disposed = false;
  const levelLoader = new ProgressiveLevelLoader<LevelSceneRuntime>(GAME_LEVELS.length, async (index, reportProgress) => {
    const level = getLevel(index);
    if (index > 0 && options.backgroundLevelDelayMs && options.backgroundLevelDelayMs > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, options.backgroundLevelDelayMs));
    }
    await loadModelSource(level.targetBuilding.modelUrl, reportProgress);
    if (disposed) throw new Error('Street scene was disposed before the level became ready.');
    return buildLevelScene(level);
  });

  await levelLoader.ensure(0);

  const applyTheme = (level: LevelDefinition): void => {
    sky.uniforms.topColor.value.set(level.theme.skyTop);
    sky.uniforms.horizonColor.value.set(level.theme.skyHorizon);
    sky.uniforms.bottomColor.value.set(level.theme.skyBottom);
    levelFog.color.set(level.theme.fog);
    levelFog.density = level.theme.fogDensity;
    scene.fog = levelFog;
    hemisphere.color.set(level.theme.hemisphereSky);
    hemisphere.groundColor.set(level.theme.hemisphereGround);
    hemisphere.intensity = level.theme.hemisphereIntensity;
    sun.color.set(level.theme.sun);
    sun.intensity = level.theme.sunIntensity;
    groundMaterial.color.set(level.theme.ground);
    sidewalkMaterial.color.set(level.theme.sidewalk);
    curbMaterial.color.set(level.theme.curb);
    roadMarkings.centerMaterial.color.set(level.theme.roadPaint);
    roadMarkings.edgeMaterial.color.set(level.theme.roadPaint).multiplyScalar(0.88);
    const roadTint = new THREE.Color(level.theme.ground).lerp(new THREE.Color('#1b2028'), 0.58);
    for (const material of roadMaterials) {
      if ('color' in material && material.color instanceof THREE.Color) material.color.copy(roadTint);
    }
    commonBackground.visible = !['seaside', 'desert', 'snow', 'autumn', 'canyon'].includes(level.themeKey);
  };

  const setLevel = (requestedIndex: number): StreetLandmarks => {
    if (disposed) throw new Error('Street scene runtime is disposed.');
    const index = safeLevelIndex(requestedIndex);
    const level = getLevel(index);
    const activeScene = levelLoader.get(index);
    if (levelLoader.getState(index) !== 'ready' || !activeScene) {
      throw new Error(`Level ${index + 1} is not ready.`);
    }
    activeLevelIndex = index;
    for (let levelIndex = 0; levelIndex < GAME_LEVELS.length; levelIndex += 1) {
      const isActive = levelIndex === index;
      const levelScene = levelLoader.get(levelIndex);
      if (!levelScene) continue;
      levelScene.target.root.visible = isActive;
      levelScene.decor.root.visible = isActive;
    }
    toiletGroup.position.copy(tupleToVector(level.toiletSign.position));
    toiletGroup.rotation.y = level.toiletSign.rotationY;
    waweiGroup.position.copy(activeScene.target.signPosition);
    waweiGroup.rotation.set(0, 0, 0);
    landmarks.startPosition.copy(tupleToVector(level.startPosition));
    landmarks.startLookTarget.copy(tupleToVector(level.startLookTarget));
    applyTheme(level);

    root.updateMatrixWorld(true);
    const arrowWorld = arrowTip.getWorldPosition(new THREE.Vector3());
    const wawaWorld = waweiFace.getWorldPosition(new THREE.Vector3());
    const viewportAspect = renderer.domElement.clientWidth / Math.max(1, renderer.domElement.clientHeight);
    const solutionPullback = viewportAspect < 0.85
      ? level.portraitSolutionPullback ?? level.solutionPullback
      : level.solutionPullback;
    landmarks.solutionPosition
      .copy(arrowWorld)
      .addScaledVector(arrowWorld.clone().sub(wawaWorld), solutionPullback);
    landmarks.solutionPosition.y = CAMERA_HEIGHT;
    return landmarks;
  };

  const update = (deltaSeconds: number): void => {
    if (disposed) return;
    levelLoader.get(activeLevelIndex)?.decor.update?.(deltaSeconds);
  };

  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    levelLoader.dispose();
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>([toiletTexture, waweiTexture]);
    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points)) return;
      if (object.geometry instanceof THREE.BufferGeometry) geometries.add(object.geometry);
      const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of objectMaterials) {
        materials.add(material);
        disposeMaterialTextures(material, textures);
      }
    });
    root.removeFromParent();
    root.clear();
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    for (const texture of textures) texture.dispose();
    modelSources.clear();
    modelPromises.clear();
    scene.fog = previousFog;
  };

  scene.add(root);
  setLevel(0);
  void levelLoader.preloadRemaining(1);

  return {
    root,
    landmarks,
    get activeLevelIndex(): number {
      return activeLevelIndex;
    },
    getLevelLoadState: (index) => levelLoader.getState(safeLevelIndex(index)),
    ensureLevel: async (index, onProgress) => {
      await levelLoader.ensure(safeLevelIndex(index), onProgress);
    },
    preloadRemaining: () => {
      void levelLoader.preloadRemaining(1);
    },
    setLevel,
    update,
    dispose,
  };
}
