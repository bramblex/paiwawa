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
  themeKey: 'sunset' | 'rain' | 'construction' | 'harbor' | 'neon' | 'seaside' | 'desert' | 'snow' | 'autumn' | 'canyon';
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
    subtitle: '首批「辱 WAWA」路牌刚被举报。对方利用远近关系，把箭头藏进 WAWA 的楼顶坐标。',
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
    subtitle: '雨幕掩护了第二处布牌行动；取证系统仍需要一张指向关系清晰的照片。',
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
    subtitle: '涉事路牌混进施工围挡，疑似有人借工地转移现场证据。',
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
    subtitle: '线索抵达港区：集装箱与浓雾正在掩护一处跨区布牌点。',
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
    name: '霓虹中枢',
    subtitle: '第五处证据让行动暴露。WAWA 公关开始集中清理，街区警戒系统随即升级。',
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
  {
    id: 'sunny-seaside', number: 6, name: '晴日海滨', subtitle: '清理行动外泄，蓝帽保安已站到路牌下方；镜头正对太久会触发身份误判。', clue: '沿左侧退到海风尽头。', themeKey: 'seaside',
    theme: { skyTop: '#2d86b5', skyHorizon: '#8fd4df', skyBottom: '#d9f1df', fog: '#9bcfd1', fogDensity: 0.012, hemisphereSky: '#d5f5ff', hemisphereGround: '#496b60', hemisphereIntensity: 2.8, sun: '#fff1b0', sunIntensity: 3.6, ground: '#6b8273', sidewalk: '#c5b99d', curb: '#e4d7b5', roadPaint: '#fff0c1' },
    targetBuilding: { modelUrl: '/assets/models/buildings/building-c.glb', position: [7, 0, -30], scale: 2.25, rotationY: 0 },
    toiletSign: { position: [-4.5, 0, -8], rotationY: 0 }, startPosition: [1, 1.65, 8], startLookTarget: [-7, 2.8, -11], movementBounds: { minX: -16, maxX: 9, minZ: -36, maxZ: 18 }, solutionPullback: 0.9, portraitSolutionPullback: 1.05,
    streetLife: { seed: 0x534541, palette: 'jade', pedestrianCount: 1, carCount: 1, style: { minZ: -34, maxZ: -1, pedestrianSpeed: 0.34, carSpeed: 0.9 } },
  },
  {
    id: 'golden-desert', number: 7, name: '金色沙漠', subtitle: '涉事组织把路牌转移到沙漠测试区，警戒范围更大，退路也更长。', clue: '继续后退，别被近处的热浪骗了。', themeKey: 'desert',
    theme: { skyTop: '#d4773d', skyHorizon: '#eeb56a', skyBottom: '#f8df9c', fog: '#d8a66c', fogDensity: 0.014, hemisphereSky: '#ffe0a5', hemisphereGround: '#73533c', hemisphereIntensity: 2.5, sun: '#fff0bd', sunIntensity: 3.8, ground: '#9b805d', sidewalk: '#c8a577', curb: '#e4c48d', roadPaint: '#f5db9b' },
    targetBuilding: { modelUrl: '/assets/models/buildings/building-a.glb', position: [5.5, 0, -34], scale: 2.15, rotationY: Math.PI / 2 },
    toiletSign: { position: [-4.55, 0, -15], rotationY: 0 }, startPosition: [-1.5, 1.65, 9], startLookTarget: [-7, 2.7, -9], movementBounds: { minX: -16, maxX: 9.5, minZ: -41, maxZ: 25 }, solutionPullback: 1.0, portraitSolutionPullback: 1.15,
    streetLife: { seed: 0x444553, palette: 'coral', pedestrianCount: 1, carCount: 1, style: { minZ: -39, maxZ: -3, pedestrianSpeed: 0.3, carSpeed: 0.82 } },
  },
  {
    id: 'snow-town', number: 8, name: '雪山小镇', subtitle: '低温让取证设备响应迟缓，蓝帽保安仍守在涉事路牌下方。', clue: '绕开雪堆，从右侧深处回望。', themeKey: 'snow',
    theme: { skyTop: '#42698d', skyHorizon: '#a8c9df', skyBottom: '#e9f3f4', fog: '#b8ced7', fogDensity: 0.019, hemisphereSky: '#dbeeff', hemisphereGround: '#53636b', hemisphereIntensity: 2.4, sun: '#fff9e8', sunIntensity: 2.7, ground: '#8b9999', sidewalk: '#d6dadd', curb: '#f1f3ed', roadPaint: '#f7fbf4' },
    targetBuilding: { modelUrl: '/assets/models/buildings/building-h.glb', position: [7.5, 0, -31], scale: 2.3, rotationY: -Math.PI / 2 },
    toiletSign: { position: [-4.6, 0, -4], rotationY: 0 }, startPosition: [3.5, 1.65, 10], startLookTarget: [-7, 3, -10], movementBounds: { minX: -16, maxX: 10, minZ: -38, maxZ: 24 }, solutionPullback: 0.82, portraitSolutionPullback: 0.98,
    streetLife: { seed: 0x534e4f, palette: 'cobalt', pedestrianCount: 1, carCount: 1, style: { minZ: -36, maxZ: -2, pedestrianSpeed: 0.28, carSpeed: 0.78 } },
  },
  {
    id: 'autumn-highway', number: 9, name: '秋林公路', subtitle: '对方开始反向布置指向关系；必须跨过道路取证，同时避开保安锁定。', clue: '穿过道路，从右侧回望左方。', themeKey: 'autumn',
    theme: { skyTop: '#4b3540', skyHorizon: '#c8784f', skyBottom: '#e6b276', fog: '#aa725b', fogDensity: 0.018, hemisphereSky: '#e6b08a', hemisphereGround: '#4e3b32', hemisphereIntensity: 2.2, sun: '#ffd39b', sunIntensity: 2.8, ground: '#5b604c', sidewalk: '#98856b', curb: '#cdb58e', roadPaint: '#e8d5a5' },
    targetBuilding: { modelUrl: '/assets/models/buildings/building-m.glb', position: [-7, 0, -33], scale: 1.15, rotationY: 0 },
    toiletSign: { position: [-4.65, 0, -18], rotationY: 0 }, startPosition: [4.5, 1.65, 7], startLookTarget: [7, 2.8, -10], movementBounds: { minX: -16, maxX: 10, minZ: -40, maxZ: 25 }, solutionPullback: 0.72, portraitSolutionPullback: 0.72,
    streetLife: { seed: 0x415554, palette: 'lantern', pedestrianCount: 1, carCount: 1, style: { minZ: -38, maxZ: -4, pedestrianSpeed: 0.3, carSpeed: 0.84 } },
  },
  {
    id: 'canyon-old-town', number: 10, name: '峡谷古镇', subtitle: '最后一处「辱 WAWA」点位藏在峡谷旧镇，完成证据闭环即可通知公关总清除。', clue: '走到峡谷深处，再从左侧回望。', themeKey: 'canyon',
    theme: { skyTop: '#3c2a35', skyHorizon: '#a7573e', skyBottom: '#d49a63', fog: '#7b5147', fogDensity: 0.021, hemisphereSky: '#d99a76', hemisphereGround: '#3b302c', hemisphereIntensity: 2.0, sun: '#ffc487', sunIntensity: 2.5, ground: '#66544a', sidewalk: '#8c7562', curb: '#c0a07b', roadPaint: '#e2c08a' },
    targetBuilding: { modelUrl: '/assets/models/buildings/building-l.glb', position: [7.5, 0, -37], scale: 1.2, rotationY: Math.PI / 2 },
    toiletSign: { position: [-4.7, 0, -21], rotationY: 0 }, startPosition: [-4, 1.65, 8.5], startLookTarget: [-8, 2.9, -11], movementBounds: { minX: -16, maxX: 11, minZ: -45, maxZ: 25 }, solutionPullback: 1.08, portraitSolutionPullback: 1.2,
    streetLife: { seed: 0x43414e, palette: 'plum', pedestrianCount: 1, carCount: 1, style: { minZ: -43, maxZ: -6, pedestrianSpeed: 0.26, carSpeed: 0.72 } },
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
