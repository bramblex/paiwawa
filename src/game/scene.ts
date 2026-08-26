import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { GAME_LEVELS, getLevel, type LevelDefinition, type Vector3Tuple } from './levels';

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
}

export interface StreetSceneRuntime {
  readonly root: THREE.Group;
  readonly landmarks: StreetLandmarks;
  readonly activeLevelIndex: number;
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

const ROAD_MODEL_URL = '/assets/models/roads/road-straight.glb';
const BACKGROUND_TOWER_URL = '/assets/models/buildings/building-skyscraper-b.glb';
const BACKGROUND_BLOCK_URL = '/assets/models/buildings/building-f.glb';
const TOILET_TEXTURE_URL = '/assets/signs/public-toilet-450m-front-texture.png';
const WAWA_TEXTURE_URL = '/assets/signs/wawa-bamboo-cicada-lightbox-front.png';
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

const addDistantToilet = (parent: THREE.Object3D, renderer: THREE.WebGLRenderer): void => {
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

const makeDecor = (level: LevelDefinition): DecorRuntime => {
  switch (level.themeKey) {
    case 'sunset': return makeSunsetDecor();
    case 'rain': return makeRainDecor();
    case 'construction': return makeConstructionDecor();
    case 'harbor': return makeHarborDecor();
    case 'neon': return makeNeonDecor();
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
  const manager = new THREE.LoadingManager();
  manager.onProgress = (url, loaded, total) => {
    options.onProgress?.(total > 0 ? loaded / total : 0, url.split('/').at(-1) ?? url);
  };

  const gltfLoader = new GLTFLoader(manager);
  const textureLoader = new THREE.TextureLoader(manager);
  const targetModelUrls = GAME_LEVELS.map((level) => level.targetBuilding.modelUrl);
  const modelUrls = [...new Set([
    ROAD_MODEL_URL,
    BACKGROUND_TOWER_URL,
    BACKGROUND_BLOCK_URL,
    ...targetModelUrls,
  ])];
  const [modelEntries, toiletTexture, waweiTexture] = await Promise.all([
    Promise.all(modelUrls.map(async (url) => [url, (await gltfLoader.loadAsync(url)).scene] as const)),
    textureLoader.loadAsync(TOILET_TEXTURE_URL),
    textureLoader.loadAsync(WAWA_TEXTURE_URL),
  ]);
  const modelSources = new Map<string, THREE.Object3D>(modelEntries);
  const modelSource = (url: string): THREE.Object3D => {
    const source = modelSources.get(url);
    if (!source) throw new Error(`Missing loaded street model: ${url}`);
    return source;
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
  addDistantToilet(commonBackground, renderer);
  for (const [x, z, side] of [
    [-4.05, -5, 1],
    [-4.05, -15, 1],
    [4.05, -8, -1],
    [4.05, -27, -1],
  ] as const) {
    addStreetLight(commonBackground, x, z, side);
  }
  root.add(commonBackground);

  const targetBuildings: TargetBuildingRuntime[] = GAME_LEVELS.map((level) => {
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
    return { root: levelRoot, signPosition };
  });

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

  const decorRuntimes = GAME_LEVELS.map((level) => {
    const decor = makeDecor(level);
    decor.root.visible = false;
    root.add(decor.root);
    return decor;
  });

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
  };

  const setLevel = (requestedIndex: number): StreetLandmarks => {
    if (disposed) return landmarks;
    const index = safeLevelIndex(requestedIndex);
    const level = getLevel(index);
    activeLevelIndex = index;
    for (let levelIndex = 0; levelIndex < GAME_LEVELS.length; levelIndex += 1) {
      const isActive = levelIndex === index;
      targetBuildings[levelIndex].root.visible = isActive;
      decorRuntimes[levelIndex].root.visible = isActive;
    }
    toiletGroup.position.copy(tupleToVector(level.toiletSign.position));
    toiletGroup.rotation.y = level.toiletSign.rotationY;
    waweiGroup.position.copy(targetBuildings[index].signPosition);
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
    decorRuntimes[activeLevelIndex].update?.(deltaSeconds);
  };

  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
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
    scene.fog = previousFog;
  };

  scene.add(root);
  setLevel(0);

  return {
    root,
    landmarks,
    get activeLevelIndex(): number {
      return activeLevelIndex;
    },
    setLevel,
    update,
    dispose,
  };
}
