import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export interface StreetLandmarks {
  toiletFace: THREE.Mesh;
  arrowTip: THREE.Object3D;
  waweiFace: THREE.Mesh;
  startPosition: THREE.Vector3;
  startLookTarget: THREE.Vector3;
}

export interface StreetSceneOptions {
  onProgress?: (ratio: number, currentAsset: string) => void;
}

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

const makeSky = (): THREE.Mesh => {
  const geometry = new THREE.SphereGeometry(110, 32, 18);
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color('#17243a') },
      horizonColor: { value: new THREE.Color('#d98662') },
      bottomColor: { value: new THREE.Color('#f4c58f') },
    },
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
  const sky = new THREE.Mesh(geometry, material);
  sky.frustumCulled = false;
  return sky;
};

const makeRoadMarkings = (scene: THREE.Scene): void => {
  const paint = new THREE.MeshStandardMaterial({
    color: '#e8dcbf',
    roughness: 0.82,
    metalness: 0,
  });

  for (let z = 10; z >= -34; z -= 5.2) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.018, 2.5), paint);
    dash.position.set(0, 0.09, z);
    dash.receiveShadow = true;
    scene.add(dash);
  }

  const edgePaint = new THREE.MeshStandardMaterial({ color: '#d7c9ad', roughness: 0.9 });
  for (const x of [-3.28, 3.28]) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.015, 48), edgePaint);
    line.position.set(x, 0.085, -10);
    line.receiveShadow = true;
    scene.add(line);
  }
};

const addStreetLight = (scene: THREE.Scene, x: number, z: number, faceRoad: number): void => {
  const metal = new THREE.MeshStandardMaterial({ color: '#25313b', roughness: 0.42, metalness: 0.55 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.065, 3.8, 10), metal);
  pole.position.set(x, 1.9, z);
  pole.castShadow = true;
  scene.add(pole);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.055, 0.055), metal);
  arm.position.set(x + faceRoad * 0.29, 3.73, z);
  arm.castShadow = true;
  scene.add(arm);

  const bulbMaterial = new THREE.MeshBasicMaterial({ color: '#ffd39b' });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 8), bulbMaterial);
  bulb.position.set(x + faceRoad * 0.58, 3.65, z);
  scene.add(bulb);

  const glow = new THREE.PointLight('#ffc47f', 1.15, 6.5, 2);
  glow.position.copy(bulb.position);
  scene.add(glow);
};

const addTree = (scene: THREE.Scene, x: number, z: number, scale: number): void => {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13 * scale, 0.18 * scale, 1.5 * scale, 8),
    new THREE.MeshStandardMaterial({ color: '#5b4335', roughness: 1 }),
  );
  trunk.position.set(x, 0.75 * scale, z);
  trunk.castShadow = true;
  scene.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.95 * scale, 1),
    new THREE.MeshStandardMaterial({ color: '#304e45', roughness: 0.96 }),
  );
  crown.scale.set(0.88, 1.2, 0.88);
  crown.position.set(x, 2.05 * scale, z);
  crown.castShadow = true;
  scene.add(crown);
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

const addDistantToilet = (
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
): void => {
  const group = new THREE.Group();
  group.position.set(-8.95, 0, -31.8);

  const wallMaterial = new THREE.MeshStandardMaterial({ color: '#d7d0c0', roughness: 0.9 });
  const trimMaterial = new THREE.MeshStandardMaterial({ color: '#234967', roughness: 0.64, metalness: 0.08 });
  const doorMaterial = new THREE.MeshStandardMaterial({ color: '#183247', roughness: 0.7 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(5.5, 2.55, 3.3), wallMaterial);
  body.position.y = 1.39;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(5.9, 0.25, 3.7), trimMaterial);
  roof.position.y = 2.79;
  roof.castShadow = true;
  group.add(roof);

  for (const x of [-1.12, 1.12]) {
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.22, 1.88, 0.09), doorMaterial);
    door.position.set(x, 1.06, 1.69);
    door.castShadow = true;
    group.add(door);

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
  const signBack = new THREE.Mesh(
    new RoundedBoxGeometry(signWidth + 0.12, signHeight + 0.12, 0.14, 3, 0.045),
    new THREE.MeshStandardMaterial({ color: '#17344f', metalness: 0.38, roughness: 0.4 }),
  );
  signBack.position.set(0, 2.3, 1.72);
  signBack.castShadow = true;
  group.add(signBack);

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

  const canopy = new THREE.Mesh(new THREE.BoxGeometry(4.25, 0.12, 0.7), trimMaterial);
  canopy.position.set(0, 2.92, 1.7);
  canopy.castShadow = true;
  group.add(canopy);

  for (const x of [-1.55, 1.55]) {
    const hanger = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.06), trimMaterial);
    hanger.position.set(x, 2.67, 1.79);
    hanger.castShadow = true;
    group.add(hanger);
  }

  const porch = new THREE.Mesh(
    new THREE.BoxGeometry(5.8, 0.12, 1.5),
    new THREE.MeshStandardMaterial({ color: '#b8ae9d', roughness: 0.96 }),
  );
  porch.position.set(0, 0.09, 2.08);
  porch.receiveShadow = true;
  group.add(porch);

  const signLight = new THREE.PointLight('#bcd9ff', 1.2, 7, 2);
  signLight.position.set(0, 2.65, 2.2);
  group.add(signLight);
  scene.add(group);
};

const placeBuilding = (
  scene: THREE.Scene,
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
  scene.add(root);
  return { root, bounds };
};

export async function createStreetScene(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  options: StreetSceneOptions = {},
): Promise<StreetLandmarks> {
  const manager = new THREE.LoadingManager();
  manager.onProgress = (url, loaded, total) => {
    options.onProgress?.(total > 0 ? loaded / total : 0, url.split('/').at(-1) ?? url);
  };

  const gltfLoader = new GLTFLoader(manager);
  const textureLoader = new THREE.TextureLoader(manager);
  const [roadGltf, mainBuildingGltf, backgroundTowerGltf, backgroundBlockGltf, toiletTexture, waweiTexture] =
    await Promise.all([
      gltfLoader.loadAsync('/assets/models/roads/road-straight.glb'),
      gltfLoader.loadAsync('/assets/models/buildings/building-n.glb'),
      gltfLoader.loadAsync('/assets/models/buildings/building-skyscraper-b.glb'),
      gltfLoader.loadAsync('/assets/models/buildings/building-f.glb'),
      textureLoader.loadAsync('/assets/signs/public-toilet-450m-front-texture.png'),
      textureLoader.loadAsync('/assets/signs/wawa-bamboo-cicada-lightbox-front.png'),
    ]);

  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  for (const texture of [toiletTexture, waweiTexture]) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = maxAnisotropy;
  }

  scene.add(makeSky());
  scene.fog = new THREE.FogExp2('#ad876e', 0.017);

  const hemisphere = new THREE.HemisphereLight('#aec7ef', '#3d3029', 2.35);
  scene.add(hemisphere);

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
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(70, 70),
    new THREE.MeshStandardMaterial({ color: '#59665f', roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.035, -8);
  ground.receiveShadow = true;
  scene.add(ground);

  markShadows(roadGltf.scene);
  for (let index = 0; index < 7; index += 1) {
    const road = roadGltf.scene.clone(true);
    road.scale.set(7.15, 1, 7.15);
    road.position.set(0, 0.01, 10.4 - index * 7.12);
    road.traverse((child) => {
      if (child instanceof THREE.Mesh) child.receiveShadow = true;
    });
    scene.add(road);
  }
  makeRoadMarkings(scene);

  const sidewalkMaterial = new THREE.MeshStandardMaterial({ color: '#a79d8d', roughness: 0.94 });
  const curbMaterial = new THREE.MeshStandardMaterial({ color: '#d2c7b5', roughness: 0.9 });
  for (const x of [-4.65, 4.65]) {
    const sidewalk = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.16, 48), sidewalkMaterial);
    sidewalk.position.set(x, 0.07, -10);
    sidewalk.receiveShadow = true;
    scene.add(sidewalk);

    const curb = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, 48), curbMaterial);
    curb.position.set(Math.sign(x) * 3.42, 0.11, -10);
    curb.castShadow = true;
    curb.receiveShadow = true;
    scene.add(curb);
  }

  const mainBuilding = placeBuilding(
    scene,
    mainBuildingGltf.scene,
    new THREE.Vector3(6.3, 0, -21.7),
    2.2,
  );
  placeBuilding(
    scene,
    backgroundTowerGltf.scene,
    new THREE.Vector3(10.8, 0, -29),
    1.65,
    Math.PI / 2,
  );
  placeBuilding(
    scene,
    backgroundBlockGltf.scene,
    new THREE.Vector3(-14, 0, -23),
    2.4,
    -Math.PI / 2,
  );
  addDistantToilet(scene, renderer);

  const mainCenter = mainBuilding.bounds.getCenter(new THREE.Vector3());
  const waweiWidth = 2.3;
  const waweiHeight = 2.3;
  const waweiGroup = new THREE.Group();
  waweiGroup.position.set(mainCenter.x, mainBuilding.bounds.max.y + 1.34, mainBuilding.bounds.max.z + 0.14);

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
  waweiFace.position.z = 0.101;
  waweiFace.renderOrder = 2;
  waweiGroup.add(waweiFace);

  const supportMaterial = new THREE.MeshStandardMaterial({ color: '#312a2b', metalness: 0.55, roughness: 0.4 });
  for (const offsetX of [-0.68, 0.68]) {
    const support = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.9, 0.09), supportMaterial);
    support.position.set(offsetX, -1.53, -0.02);
    support.castShadow = true;
    waweiGroup.add(support);
  }
  scene.add(waweiGroup);

  const waweiGlow = new THREE.PointLight('#ffb0a4', 1.8, 7, 2);
  waweiGlow.position.set(0, 0, 0.55);
  waweiGroup.add(waweiGlow);

  const toiletGroup = new THREE.Group();
  toiletGroup.position.set(-4.25, 0, 1.0);
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
  toiletFace.position.set(0, toiletY, 0.082);
  toiletFace.renderOrder = 3;
  toiletGroup.add(toiletFace);

  const arrowTip = new THREE.Object3D();
  arrowTip.position.set(toiletWidth * 0.363, -toiletHeight * 0.29, 0.012);
  toiletFace.add(arrowTip);

  const poleMaterial = new THREE.MeshStandardMaterial({ color: '#34434d', metalness: 0.65, roughness: 0.34 });
  const toiletPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.075, 3.68, 12),
    poleMaterial,
  );
  toiletPole.position.set(-1.83, 1.84, -0.07);
  toiletPole.castShadow = true;
  toiletGroup.add(toiletPole);
  scene.add(toiletGroup);

  for (const [x, z, side] of [
    [-4.05, -5, 1],
    [-4.05, -15, 1],
    [4.05, -8, -1],
    [4.05, -27, -1],
  ] as const) {
    addStreetLight(scene, x, z, side);
  }
  addTree(scene, -5.15, -9.5, 0.9);
  addTree(scene, -12.2, -19.5, 0.92);
  addTree(scene, 5.05, -3.5, 0.78);

  return {
    toiletFace,
    arrowTip,
    waweiFace,
    startPosition: new THREE.Vector3(0, 1.65, 9.5),
    startLookTarget: new THREE.Vector3(0.4, 4.0, -9),
  };
}
