import type { StreetLifePaletteName, StreetLifeStyleOptions } from './street-life';

export type Vector3Tuple = readonly [x: number, y: number, z: number];

export interface MovementBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface LevelTheme {
  skyTop: string;
  skyHorizon: string;
  skyBottom: string;
  fog: string;
  fogDensity: number;
  hemisphereSky: string;
  hemisphereGround: string;
  hemisphereIntensity: number;
  sun: string;
  sunIntensity: number;
  ground: string;
  sidewalk: string;
  curb: string;
  roadPaint: string;
}

export interface LevelDefinition {
  id: string;
  number: number;
  name: string;
  subtitle: string;
  clue: string;
  themeKey: 'sunset' | 'rain' | 'construction' | 'harbor' | 'neon';
  theme: LevelTheme;
  targetBuilding: {
    modelUrl: string;
    position: Vector3Tuple;
    scale: number;
    rotationY: number;
  };
  toiletSign: {
    position: Vector3Tuple;
    rotationY: number;
  };
  startPosition: Vector3Tuple;
  startLookTarget: Vector3Tuple;
  movementBounds: MovementBounds;
  solutionPullback: number;
  portraitSolutionPullback?: number;
  streetLife: {
    seed: number;
    palette: StreetLifePaletteName;
    pedestrianCount: number;
    carCount: number;
    style: StreetLifeStyleOptions;
  };
}

export const GAME_LEVELS = [
  {
    id: 'dusk-boulevard',
    number: 1,
    name: '暮色直街',
    subtitle: '先别追着招牌跑，找一条能把远近压成一张照片的线。',
    clue: '沿左侧退开，让远近两块牌叠在一起。',
    themeKey: 'sunset',
    theme: {
      skyTop: '#17243a',
      skyHorizon: '#d76f4c',
      skyBottom: '#f2b778',
      fog: '#a96f59',
      fogDensity: 0.017,
      hemisphereSky: '#aec7ef',
      hemisphereGround: '#3d3029',
      hemisphereIntensity: 2.35,
      sun: '#ffd2a0',
      sunIntensity: 3.1,
      ground: '#59665f',
      sidewalk: '#a79d8d',
      curb: '#d2c7b5',
      roadPaint: '#e8dcbf',
    },
    targetBuilding: {
      modelUrl: '/assets/models/buildings/building-n.glb',
      position: [6.3, 0, -21.7],
      scale: 2.2,
      rotationY: 0,
    },
    toiletSign: { position: [-4.25, 0, 1], rotationY: 0 },
    startPosition: [0, 1.65, 9.5],
    startLookTarget: [0.4, 4, -9],
    movementBounds: { minX: -8.2, maxX: 7.4, minZ: -28, maxZ: 15 },
    solutionPullback: 0.28,
    portraitSolutionPullback: 0.48,
    streetLife: {
      seed: 0x50415741,
      palette: 'sunset',
      pedestrianCount: 3,
      carCount: 2,
      style: { maxZ: 5, pedestrianSpeed: 0.46, carSpeed: 1.28 },
    },
  },
  {
    id: 'rainy-overpass',
    number: 2,
    name: '雨夜高架',
    subtitle: '雨把距离藏起来了，但路牌和楼顶仍会在一条透视线上相遇。',
    clue: '雨幕藏住了距离，靠左退开再抬头。',
    themeKey: 'rain',
    theme: {
      skyTop: '#081525',
      skyHorizon: '#244866',
      skyBottom: '#55798a',
      fog: '#27475d',
      fogDensity: 0.026,
      hemisphereSky: '#77a9d0',
      hemisphereGround: '#111a24',
      hemisphereIntensity: 1.72,
      sun: '#9cc9ea',
      sunIntensity: 1.45,
      ground: '#263b43',
      sidewalk: '#66737a',
      curb: '#9fb0b6',
      roadPaint: '#a8d3df',
    },
    targetBuilding: {
      modelUrl: '/assets/models/buildings/building-skyscraper-b.glb',
      position: [6.5, 0, -23],
      scale: 1.55,
      rotationY: Math.PI / 2,
    },
    toiletSign: { position: [-4.3, 0, 3], rotationY: 0 },
    startPosition: [2, 1.65, 11.2],
    startLookTarget: [0.4, 4.8, -12],
    movementBounds: { minX: -8.4, maxX: 8.2, minZ: -29, maxZ: 15 },
    solutionPullback: 0.35,
    streetLife: {
      seed: 0x5241494e,
      palette: 'cobalt',
      pedestrianCount: 2,
      carCount: 2,
      style: { maxZ: 4, pedestrianSpeed: 0.4, carSpeed: 1.18 },
    },
  },
  {
    id: 'morning-worksite',
    number: 3,
    name: '清晨工地',
    subtitle: '脚手架挡住了直觉。别找最近的缝，找能改变前后高度关系的位置。',
    clue: '施工挡住了视线，换到护栏外侧看看。',
    themeKey: 'construction',
    theme: {
      skyTop: '#6e91a5',
      skyHorizon: '#e7ae72',
      skyBottom: '#f7d9a7',
      fog: '#c8ad87',
      fogDensity: 0.013,
      hemisphereSky: '#d7e7ed',
      hemisphereGround: '#6c5942',
      hemisphereIntensity: 2.65,
      sun: '#fff0c7',
      sunIntensity: 3.45,
      ground: '#77735e',
      sidewalk: '#b9aa8e',
      curb: '#ead6ad',
      roadPaint: '#f4d999',
    },
    targetBuilding: {
      modelUrl: '/assets/models/buildings/building-j.glb',
      position: [0.7, 0, -25],
      scale: 2.2,
      rotationY: 0,
    },
    toiletSign: { position: [-4.2, 0, -5.5], rotationY: 0 },
    startPosition: [3, 1.65, 7.2],
    startLookTarget: [0, 4.4, -17],
    movementBounds: { minX: -8.5, maxX: 7.7, minZ: -31, maxZ: 13 },
    solutionPullback: 0.65,
    streetLife: {
      seed: 0x53495445,
      palette: 'paper',
      pedestrianCount: 3,
      carCount: 1,
      style: { minZ: -31, maxZ: 2, pedestrianSpeed: 0.42, carSpeed: 1.05 },
    },
  },
  {
    id: 'fog-harbor',
    number: 4,
    name: '雾港弯道',
    subtitle: '雾会抹掉远近，集装箱却留下了方向。沿码头边缘寻找反向视差。',
    clue: '穿过中段，从道路内侧看回去。',
    themeKey: 'harbor',
    theme: {
      skyTop: '#223746',
      skyHorizon: '#66808a',
      skyBottom: '#a7b2aa',
      fog: '#6f8588',
      fogDensity: 0.031,
      hemisphereSky: '#a9c7cf',
      hemisphereGround: '#26383a',
      hemisphereIntensity: 2.05,
      sun: '#d8ece8',
      sunIntensity: 1.65,
      ground: '#3e5351',
      sidewalk: '#7c8982',
      curb: '#b4bbb0',
      roadPaint: '#d1d6c2',
    },
    targetBuilding: {
      modelUrl: '/assets/models/buildings/building-e.glb',
      position: [-7, 0, -33],
      scale: 2.75,
      rotationY: -Math.PI / 2,
    },
    toiletSign: { position: [-4.35, 0, -10], rotationY: 0 },
    startPosition: [4, 1.65, 3],
    startLookTarget: [0, 4.2, -20],
    movementBounds: { minX: -8, maxX: 8.8, minZ: -32, maxZ: 12 },
    solutionPullback: 0.75,
    streetLife: {
      seed: 0x504f5254,
      palette: 'harbor',
      pedestrianCount: 2,
      carCount: 1,
      style: { minZ: -32, maxZ: 1, pedestrianSpeed: 0.36, carSpeed: 0.92 },
    },
  },
  {
    id: 'neon-finale',
    number: 5,
    name: '霓虹终局',
    subtitle: '最后一张照片没有捷径：先越过路牌，再从街巷深处把两块光压到一起。',
    clue: '越过路牌，再从街巷左侧回望。',
    themeKey: 'neon',
    theme: {
      skyTop: '#08091a',
      skyHorizon: '#351a4d',
      skyBottom: '#8b2f52',
      fog: '#29173b',
      fogDensity: 0.023,
      hemisphereSky: '#5962c6',
      hemisphereGround: '#160d20',
      hemisphereIntensity: 1.8,
      sun: '#ff6f9c',
      sunIntensity: 1.25,
      ground: '#24223b',
      sidewalk: '#514a68',
      curb: '#8f7ca3',
      roadPaint: '#72d8e7',
    },
    targetBuilding: {
      modelUrl: '/assets/models/buildings/building-skyscraper-d.glb',
      position: [6.5, 0, -32],
      scale: 0.7,
      rotationY: Math.PI / 2,
    },
    toiletSign: { position: [-4.4, 0, -14], rotationY: 0 },
    startPosition: [4.8, 1.65, 6.8],
    startLookTarget: [0.2, 5, -22],
    movementBounds: { minX: -8.5, maxX: 8, minZ: -34, maxZ: 12 },
    solutionPullback: 0.58,
    streetLife: {
      seed: 0x4e454f4e,
      palette: 'neon',
      pedestrianCount: 2,
      carCount: 2,
      style: { minZ: -34, maxZ: 1, pedestrianSpeed: 0.44, carSpeed: 1.32 },
    },
  },
] as const satisfies readonly LevelDefinition[];

export const LEVEL_COUNT = GAME_LEVELS.length;

export const getLevel = (index: number): LevelDefinition => {
  const normalizedIndex = Number.isFinite(index) ? Math.trunc(index) : 0;
  const safeIndex = Math.min(LEVEL_COUNT - 1, Math.max(0, normalizedIndex));
  return GAME_LEVELS[safeIndex];
};

export const getNextLevelIndex = (index: number): number | null =>
  index + 1 < LEVEL_COUNT ? index + 1 : null;
