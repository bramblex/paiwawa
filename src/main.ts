import * as THREE from 'three';
import '@fontsource/zcool-qingke-huangyou/chinese-simplified-400.css';

import { evaluateComposition, type CompositionResult } from './game/alignment';
import { GameAudio } from './game/audio';
import { FirstPersonControls } from './game/controls';
import { GyroAimControls } from './game/gyro-aim';
import { GAME_LEVELS, LEVEL_COUNT, getLevel, getNextLevelIndex } from './game/levels';
import { scorePhoto, type ScoredPhotoResult } from './game/photo-score';
import { projectObjectBounds, projectObjectPoint } from './game/projection';
import { createStreetScene, type StreetLandmarks, type StreetSceneRuntime } from './game/scene';
import {
  SecurityAlertTracker,
  isSecurityLevel,
} from './game/security-alert';
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
      levelIndex: () => number;
      levelLoadState: (index: number) => ReturnType<StreetSceneRuntime['getLevelLoadState']>;
      ensureLevel: (index: number) => Promise<void>;
      setLevel: (index: number) => Promise<void>;
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
  bounds: GAME_LEVELS[0].movementBounds,
});

const timer = new THREE.Timer();
timer.connect(document);
const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
const gyro = new GyroAimControls(controls, { onStateChange: ui.setGyroState });
ui.setGyroState(gyro.currentState);
let landmarks: StreetLandmarks | null = null;
let sceneRuntime: StreetSceneRuntime | null = null;
let streetLife: StreetLife | null = null;
let activeLevelIndex = 0;
let ready = false;
let started = false;
let photoStage: 'playing' | 'judging' | 'settled' | 'caught' | 'loading' | 'load-error' = 'playing';
let pendingCapture: { photo: string; result: ScoredPhotoResult } | null = null;
let failedLevelIndex: number | null = null;
let levelTransitionToken = 0;
const securityTracker = new SecurityAlertTracker(coarsePointer);

const resetSecurityAlert = (): void => {
  securityTracker.reset();
  ui.setSecurityAlert(0, false, isSecurityLevel(activeLevelIndex));
};

const resetPlayer = (): void => {
  if (!landmarks) return;
  controls.clearMovement();
  camera.position.copy(landmarks.startPosition);
  controls.lookAt(landmarks.startLookTarget);
  gyro.recenter();
};

const replaceStreetLife = (): void => {
  streetLife?.dispose();
  const level = getLevel(activeLevelIndex);
  streetLife = createStreetLife({
    seed: level.streetLife.seed,
    pedestrianCount: level.streetLife.pedestrianCount,
    carCount: level.streetLife.carCount,
    palette: level.streetLife.palette,
    style: {
      pedestrianScale: 0.92,
      carScale: 0.86,
      carLoopPadding: 1.2,
      sidewalkX: [-4.95, 4.95],
      ...level.streetLife.style,
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

const activateLevel = (index: number): void => {
  if (!sceneRuntime) return;
  const normalizedIndex = Number.isFinite(index) ? Math.trunc(index) : 0;
  activeLevelIndex = Math.min(LEVEL_COUNT - 1, Math.max(0, normalizedIndex));
  landmarks = sceneRuntime.setLevel(activeLevelIndex);
  const level = getLevel(activeLevelIndex);
  controls.setBounds(level.movementBounds);
  ui.setLevel(level.number, LEVEL_COUNT, level.name, level.clue);
  replaceStreetLife();
  resetSecurityAlert();
  resetPlayer();
};

const evaluateLandmarks = (currentLandmarks: StreetLandmarks): CompositionResult => {
  renderer.render(scene, camera);
  const viewport = {
    width: renderer.domElement.clientWidth,
    height: renderer.domElement.clientHeight,
  };
  return evaluateComposition({
    viewport,
    toiletSign: projectObjectBounds(currentLandmarks.toiletFace, camera, viewport),
    arrowTip: projectObjectPoint(currentLandmarks.arrowTip, camera, viewport),
    waweiSign: projectObjectBounds(currentLandmarks.waweiFace, camera, viewport),
  });
};

const aimAtSolution = (currentLandmarks: StreetLandmarks): void => {
  camera.position.copy(currentLandmarks.solutionPosition);
  const arrowWorld = currentLandmarks.arrowTip.getWorldPosition(new THREE.Vector3());
  const wawaWorld = currentLandmarks.waweiFace.getWorldPosition(new THREE.Vector3());
  controls.lookAt(arrowWorld.clone().lerp(wawaWorld, 0.52));
};

const publishLevelQa = async (runtime: StreetSceneRuntime): Promise<void> => {
  if (new URLSearchParams(window.location.search).get('qa') !== 'levels') return;
  const results = [];
  for (const [index, level] of GAME_LEVELS.entries()) {
    try {
      await runtime.ensureLevel(index);
      const currentLandmarks = runtime.setLevel(index);
      aimAtSolution(currentLandmarks);
      const result = evaluateLandmarks(currentLandmarks);
      results.push({
        id: level.id,
        success: result.success,
        reason: result.reason,
        score: Number(result.score.toFixed(3)),
        dx: Number(result.dx.toFixed(1)),
        gap: Number(result.gap.toFixed(1)),
        solution: currentLandmarks.solutionPosition.toArray().map((value) => Number(value.toFixed(2))),
      });
    } catch (error) {
      results.push({
        id: level.id,
        success: false,
        reason: 'load-error',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  document.documentElement.dataset.levelQa = JSON.stringify(results);
};

const takePhoto = (): ScoredPhotoResult | null => {
  if (!ready || !started || photoStage !== 'playing' || !landmarks) return null;
  const composition = evaluateLandmarks(landmarks);
  const viewport = {
    width: renderer.domElement.clientWidth,
    height: renderer.domElement.clientHeight,
  };
  const greetingCaptions = streetLife
    ? streetLife
        .getVisibleGreetingSubtitles()
        .map((subtitle) => projectObjectBounds(subtitle, camera, viewport))
    : [];
  const result = scorePhoto(composition, greetingCaptions, viewport);

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
  gyro.recenter();
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
  const level = getLevel(activeLevelIndex);
  ui.showSettlement(result, {
    levelNumber: level.number,
    total: LEVEL_COUNT,
    name: level.name,
    isFinal: getNextLevelIndex(activeLevelIndex) === null,
  });
};

const requestLevelTransition = async (requestedIndex: number): Promise<void> => {
  if (!sceneRuntime) return;
  const targetIndex = Math.min(LEVEL_COUNT - 1, Math.max(0, Math.trunc(requestedIndex)));
  const targetLevel = getLevel(targetIndex);
  const token = ++levelTransitionToken;
  const needsLoading = sceneRuntime.getLevelLoadState(targetIndex) !== 'ready';
  failedLevelIndex = null;

  if (needsLoading) {
    photoStage = 'loading';
    pendingCapture = null;
    controls.clearMovement();
    ui.hideJudgement();
    ui.hideSettlement();
    ui.showLevelLoading(targetLevel.number, LEVEL_COUNT, targetLevel.name, targetLevel.subtitle);
    if (document.pointerLockElement) void document.exitPointerLock();
  }

  try {
    await sceneRuntime.ensureLevel(targetIndex, (progress) => {
      if (token !== levelTransitionToken || !needsLoading) return;
      ui.setLevelLoadProgress(progress.ratio, progress.label);
    });
    if (token !== levelTransitionToken) return;
    activateLevel(targetIndex);
    if (needsLoading) ui.hideLevelLoading();
    resumeGame();
  } catch (error) {
    if (token !== levelTransitionToken) return;
    console.error(error);
    failedLevelIndex = targetIndex;
    photoStage = 'load-error';
    ui.setError(`第 ${targetLevel.number} 关载入失败，请重试。`);
  }
};

const continueAfterSettlement = (): void => {
  if (photoStage === 'caught') {
    void requestLevelTransition(activeLevelIndex);
    return;
  }
  if (photoStage !== 'settled') return;
  const nextLevelIndex = getNextLevelIndex(activeLevelIndex) ?? 0;
  void requestLevelTransition(nextLevelIndex);
};

ui.startButton.addEventListener('click', () => {
  if (!ready) return;
  started = true;
  audio.start();
  ui.enterGame();
  if (coarsePointer && gyro.isSupported) void gyro.enable();
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

ui.gyroButton.addEventListener('click', (event) => {
  event.stopPropagation();
  if (gyro.currentState === 'active') gyro.recenter();
  else void gyro.enable();
});

ui.judgementRetakeButton.addEventListener('click', resumeGame);
ui.judgementContinueButton.addEventListener('click', resolveJudgement);
ui.resultContinueButton.addEventListener('click', continueAfterSettlement);
ui.loadingRetryButton.addEventListener('click', () => {
  if (failedLevelIndex === null) {
    window.location.reload();
    return;
  }
  void requestLevelTransition(failedLevelIndex);
});
ui.resetButton.addEventListener('click', () => {
  resetPlayer();
  resetSecurityAlert();
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

const triggerSecurityFailure = (): void => {
  if (photoStage !== 'playing' || !isSecurityLevel(activeLevelIndex)) return;
  photoStage = 'caught';
  pendingCapture = null;
  controls.clearMovement();
  audio.playFail();
  if (document.pointerLockElement) void document.exitPointerLock();
  const level = getLevel(activeLevelIndex);
  ui.setSecurityAlert(1, false, true);
  ui.showSecurityFailure({ levelNumber: level.number, total: LEVEL_COUNT, name: level.name });
};

const updateSecurityAlert = (deltaSeconds: number): void => {
  const enabled = isSecurityLevel(activeLevelIndex);
  if (!enabled) {
    const snapshot = securityTracker.snapshot;
    if (snapshot.ratio !== 0 || snapshot.targeted || snapshot.caught) securityTracker.reset();
    ui.setSecurityAlert(0, false, false);
    return;
  }
  if (document.hidden || !started || photoStage !== 'playing' || !landmarks) {
    ui.setSecurityAlert(securityTracker.snapshot.ratio, false, false);
    return;
  }
  const viewport = {
    width: renderer.domElement.clientWidth,
    height: renderer.domElement.clientHeight,
  };
  const snapshot = securityTracker.update(
    projectObjectBounds(landmarks.toiletFace, camera, viewport),
    viewport,
    deltaSeconds,
  );
  ui.setSecurityAlert(snapshot.ratio, snapshot.targeted, true);
  if (snapshot.caught) triggerSecurityFailure();
};

const animate = (timestamp?: number): void => {
  requestAnimationFrame(animate);
  timer.update(timestamp);
  const delta = timer.getDelta();
  if (started && photoStage === 'playing') {
    gyro.update(delta);
    controls.update(delta);
  }
  updateSecurityAlert(delta);
  streetLife?.update(delta, started && photoStage === 'playing' ? camera.position : undefined);
  sceneRuntime?.update(delta);
  renderer.render(scene, camera);
};
animate();

const pageSearchParams = new URLSearchParams(window.location.search);
const requestedBackgroundDelay = pageSearchParams.get('qa') === 'loading'
  ? Number(pageSearchParams.get('delayMs'))
  : 0;

void createStreetScene(scene, renderer, {
  onProgress: (ratio, asset) => ui.setLoading(ratio, asset),
  backgroundLevelDelayMs: Number.isFinite(requestedBackgroundDelay)
    ? Math.min(10_000, Math.max(0, requestedBackgroundDelay))
    : 0,
})
  .then(async (runtime) => {
    sceneRuntime = runtime;
    landmarks = runtime.landmarks;
    const searchParams = pageSearchParams;
    if (searchParams.get('qa') === 'loading') {
      document.documentElement.dataset.initialLevelStates = JSON.stringify(
        GAME_LEVELS.map((_level, index) => runtime.getLevelLoadState(index)),
      );
    }
    const requestedQaLevel = searchParams.get('qa') === 'levels' ? Number(searchParams.get('level')) : 0;
    await publishLevelQa(runtime);
    await runtime.ensureLevel(Number.isFinite(requestedQaLevel) ? requestedQaLevel : 0);
    activateLevel(Number.isFinite(requestedQaLevel) ? requestedQaLevel : 0);
    if (['levels', 'loading'].includes(searchParams.get('qa') ?? '') && searchParams.get('solve') === '1' && landmarks) {
      aimAtSolution(landmarks);
    }
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
      levelIndex: () => activeLevelIndex,
      levelLoadState: (index) => runtime.getLevelLoadState(index),
      ensureLevel: (index) => runtime.ensureLevel(index),
      setLevel: (index) => requestLevelTransition(index),
      audioState: () => audio.state,
    };
  })
  .catch((error: unknown) => {
    console.error(error);
    ui.setError('街景载入失败，请刷新页面重试。');
  });

window.addEventListener('beforeunload', () => {
  audio.dispose();
  gyro.dispose();
  controls.dispose();
  timer.dispose();
  if (streetLife) {
    streetLife.dispose();
  }
  sceneRuntime?.dispose();
  renderer.dispose();
});
