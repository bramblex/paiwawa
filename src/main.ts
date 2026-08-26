import * as THREE from 'three';

import { evaluateComposition, type CompositionResult } from './game/alignment';
import { GameAudio } from './game/audio';
import { FirstPersonControls } from './game/controls';
import { projectObjectBounds, projectObjectPoint } from './game/projection';
import { createStreetScene, type StreetLandmarks } from './game/scene';
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
  bounds: { minX: -6.2, maxX: 4.1, minZ: -2.2, maxZ: 12 },
});

const timer = new THREE.Timer();
timer.connect(document);
const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
let landmarks: StreetLandmarks | null = null;
let ready = false;
let started = false;
let resultOpen = false;

const resetPlayer = (): void => {
  if (!landmarks) return;
  camera.position.copy(landmarks.startPosition);
  controls.lookAt(landmarks.startLookTarget);
};

const takePhoto = (): CompositionResult | null => {
  if (!ready || !started || resultOpen || !landmarks) return null;

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
  window.setTimeout(() => {
    if (result.success) audio.playSuccess();
    else audio.playFail();
  }, 180);
  resultOpen = true;
  if (document.pointerLockElement) void document.exitPointerLock();
  const photo = renderer.domElement.toDataURL('image/jpeg', 0.9);
  ui.showResult(photo, result);
  return result;
};

const resumeGame = (): void => {
  resultOpen = false;
  ui.hideResult();
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
  if (started && ready && !resultOpen && !coarsePointer && !controls.isLocked) controls.lock();
});

document.addEventListener('pointerlockchange', () => {
  ui.setPointerLocked(controls.isLocked);
});

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && !event.repeat && started && !resultOpen) {
    event.preventDefault();
    takePhoto();
  }
  if (event.code === 'KeyR' && started && !event.repeat) {
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
  if (!started || resultOpen || controls.isLocked) return;
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
  if (started && !resultOpen) controls.update(delta);
  renderer.render(scene, camera);
};
animate();

void createStreetScene(scene, renderer, {
  onProgress: (ratio, asset) => ui.setLoading(ratio, asset),
})
  .then((loadedLandmarks) => {
    landmarks = loadedLandmarks;
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
  renderer.dispose();
});
