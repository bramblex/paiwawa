import * as THREE from 'three';
import '@fontsource/zcool-qingke-huangyou/chinese-simplified-400.css';

import { evaluateComposition, type CompositionResult } from './game/alignment';
import { GameAudio } from './game/audio';
import { FirstPersonControls } from './game/controls';
import { projectObjectBounds, projectObjectPoint } from './game/projection';
import { createStreetScene, type StreetLandmarks } from './game/scene';
import { createStreetLife, type StreetLife } from './game/street-life';
import './styles.css';
import { createGameUI } from './ui';

declare global {
  interface Window {
    __PHOTO_GAME__?: {
      camera: THREE.PerspectiveCamera;
      landmarks: StreetLandmarks;
      takePhoto: () => CompositionResult | null;
      setPlayer: (x: number, z: number) => void;
      lookAt: (x: number, y: number, z: number) => void;
      audioState: () => GameAudio['state'];
    };
  }
}

const app = document.querySelector<HTMLElement>('#app');
if (!app) throw new Error('Missing #app root');

const ui = createGameUI(app);
const audio = new GameAudio();
const shell = app.querySelector<HTMLElement>('.game-shell');
if (!shell) throw new Error('Missing game shell');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#17243a');

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.08, 130);
camera.position.set(0, 1.65, 9.5);
camera.lookAt(0.4, 4, -9);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance',
  preserveDrawingBuffer: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.domElement.setAttribute('aria-label', '可移动的 3D 街景取景画面');
renderer.domElement.tabIndex = 0;
shell.prepend(renderer.domElement);

const controls = new FirstPersonControls(camera, {
  element: renderer.domElement,
  moveSpeed: 3.35,
  sprintMultiplier: 1.65,
  lookSensitivity: 0.00215,
  cameraHeight: 1.65,
  bounds: { minX: -7.4, maxX: 5.8, minZ: -27.5, maxZ: 14.5 },
});

const timer = new THREE.Timer();
timer.connect(document);
const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
let landmarks: StreetLandmarks | null = null;
let streetLife: StreetLife | null = null;
let ready = false;
let started = false;
let photoStage: 'playing' | 'judging' | 'settled' = 'playing';
let pendingCapture: { photo: string; result: CompositionResult } | null = null;

const resetPlayer = (): void => {
  if (!landmarks) return;
  camera.position.copy(landmarks.startPosition);
  controls.lookAt(landmarks.startLookTarget);
};

const addStreetLife = (): void => {
  streetLife = createStreetLife({
    seed: 0x50415741,
    pedestrianCount: 4,
    carCount: 3,
    palette: 'sunset',
    style: {
      maxZ: 4.5,
      pedestrianSpeed: 0.48,
      pedestrianScale: 0.92,
      carSpeed: 1.35,
      carScale: 0.86,
      carLoopPadding: 1.2,
      sidewalkX: [-4.95, 4.95],
    },
    greeting: {
      text: '遥遥领先',
      triggerRadius: 5.4,
      durationSeconds: 2.5,
      cooldownSeconds: 6,
      onSpeak: () => audio.playGreeting(),
    },
  });
  scene.add(streetLife.root);
};

const takePhoto = (): CompositionResult | null => {
  if (!ready || !started || photoStage !== 'playing' || !landmarks) return null;

  renderer.render(scene, camera);
  const viewport = {
    width: renderer.domElement.clientWidth,
    height: renderer.domElement.clientHeight,
  };
  const result = evaluateComposition({
    viewport,
    toiletSign: projectObjectBounds(landmarks.toiletFace, camera, viewport),
    arrowTip: projectObjectPoint(landmarks.arrowTip, camera, viewport),
    waweiSign: projectObjectBounds(landmarks.waweiFace, camera, viewport),
  });

  audio.playShutter();
  if (result.success) audio.playSuccess();
  else audio.playFail();
  photoStage = 'judging';
  const photo = renderer.domElement.toDataURL('image/jpeg', 0.9);
  pendingCapture = { photo, result };
  if (document.pointerLockElement) void document.exitPointerLock();
  ui.showJudgement(photo, result);
  return result;
};

const resumeGame = (): void => {
  pendingCapture = null;
  photoStage = 'playing';
  ui.hideJudgement();
  ui.hideSettlement();
  renderer.domElement.focus();
};

const resolveJudgement = (): void => {
  if (photoStage !== 'judging' || !pendingCapture) return;

  if (!pendingCapture.result.success) {
    resumeGame();
    return;
  }

  const result = pendingCapture.result;
  pendingCapture = null;
  photoStage = 'settled';
  ui.showSettlement(result);
};

ui.startButton.addEventListener('click', () => {
  if (!ready) return;
  started = true;
  audio.start();
  ui.enterGame();
  renderer.domElement.focus();
});

ui.shutterButton.addEventListener('click', (event) => {
  event.stopPropagation();
  takePhoto();
});

ui.audioButton.addEventListener('click', (event) => {
  event.stopPropagation();
  ui.setMuted(audio.toggleMuted());
});

ui.judgementRetakeButton.addEventListener('click', resumeGame);
ui.judgementContinueButton.addEventListener('click', resolveJudgement);
ui.resultContinueButton.addEventListener('click', resumeGame);
ui.resetButton.addEventListener('click', () => {
  resetPlayer();
  resumeGame();
});

let suppressCanvasClick = false;
renderer.domElement.addEventListener('click', () => {
  if (suppressCanvasClick) {
    suppressCanvasClick = false;
    return;
  }
  if (started && ready && photoStage === 'playing' && !coarsePointer && !controls.isLocked) controls.lock();
});

document.addEventListener('pointerlockchange', () => {
  ui.setPointerLocked(controls.isLocked);
});

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && !event.repeat && started && photoStage === 'playing') {
    event.preventDefault();
    takePhoto();
  }
  if (event.code === 'KeyR' && started && !event.repeat && photoStage === 'playing') {
    event.preventDefault();
    resetPlayer();
  }
  if (event.code === 'KeyM' && started && !event.repeat) {
    event.preventDefault();
    ui.setMuted(audio.toggleMuted());
  }
});

for (const button of ui.mobileMoveButtons) {
  const stop = (event: PointerEvent): void => {
    event.preventDefault();
    button.classList.remove('is-active');
    controls.setTouchMove(0, 0);
  };
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    button.setPointerCapture(event.pointerId);
    button.classList.add('is-active');
    controls.setTouchMove(Number(button.dataset.moveX), Number(button.dataset.moveZ));
  });
  button.addEventListener('pointerup', stop);
  button.addEventListener('pointercancel', stop);
  button.addEventListener('lostpointercapture', stop);
}

let lookPointerId: number | null = null;
let lastLookX = 0;
let lastLookY = 0;
let lookDragDistance = 0;
renderer.domElement.addEventListener('pointerdown', (event) => {
  if (!started || photoStage !== 'playing' || controls.isLocked) return;
  lookPointerId = event.pointerId;
  lastLookX = event.clientX;
  lastLookY = event.clientY;
  lookDragDistance = 0;
  renderer.domElement.setPointerCapture(event.pointerId);
});
renderer.domElement.addEventListener('pointermove', (event) => {
  if (event.pointerId !== lookPointerId) return;
  const dx = event.clientX - lastLookX;
  const dy = event.clientY - lastLookY;
  lookDragDistance += Math.hypot(dx, dy);
  controls.rotateBy(dx, dy);
  lastLookX = event.clientX;
  lastLookY = event.clientY;
});
const releaseLook = (event: PointerEvent): void => {
  if (event.pointerId !== lookPointerId) return;
  suppressCanvasClick = lookDragDistance > 4;
  lookPointerId = null;
};
renderer.domElement.addEventListener('pointerup', releaseLook);
renderer.domElement.addEventListener('pointercancel', releaseLook);

const onResize = (): void => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
};
window.addEventListener('resize', onResize);

const animate = (timestamp?: number): void => {
  requestAnimationFrame(animate);
  timer.update(timestamp);
  const delta = timer.getDelta();
  if (started && photoStage === 'playing') controls.update(delta);
  streetLife?.update(delta, started && photoStage === 'playing' ? camera.position : undefined);
  renderer.render(scene, camera);
};
animate();

void createStreetScene(scene, renderer, {
  onProgress: (ratio, asset) => ui.setLoading(ratio, asset),
})
  .then((loadedLandmarks) => {
    landmarks = loadedLandmarks;
    addStreetLife();
    resetPlayer();
    ready = true;
    ui.setReady();
    window.__PHOTO_GAME__ = {
      camera,
      landmarks,
      takePhoto,
      setPlayer: (x, z) => {
        camera.position.x = x;
        camera.position.z = z;
      },
      lookAt: (x, y, z) => controls.lookAt(new THREE.Vector3(x, y, z)),
      audioState: () => audio.state,
    };
  })
  .catch((error: unknown) => {
    console.error(error);
    ui.setError('街景载入失败，请刷新页面重试。');
  });

window.addEventListener('beforeunload', () => {
  audio.dispose();
  controls.dispose();
  timer.dispose();
  if (streetLife) {
    streetLife.root.removeFromParent();
    streetLife.dispose();
  }
  renderer.dispose();
});
