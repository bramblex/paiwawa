import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createStreetLife, DEFAULT_STREET_LIFE_STYLE } from './street-life';

const style = {
  maxZ: 4.5,
  minZ: DEFAULT_STREET_LIFE_STYLE.minZ,
  sidewalkX: [-4.95, 4.95] as const,
  laneX: DEFAULT_STREET_LIFE_STYLE.laneX,
  carLoopPadding: 1.2,
};

describe('sparse street life', () => {
  it('creates the requested pedestrians and cars in the authored street bounds', () => {
    const life = createStreetLife({ pedestrianCount: 4, carCount: 3, seed: 42, style });
    const pedestrians = life.root.getObjectByName('Pedestrians');
    const cars = life.root.getObjectByName('Cars');

    expect(pedestrians?.children.map((actor) => actor.name)).toEqual([
      'Pedestrian-1',
      'Pedestrian-2',
      'Pedestrian-3',
      'Pedestrian-4',
    ]);
    expect(cars?.children.map((actor) => actor.name)).toEqual(['Car-1', 'Car-2', 'Car-3']);

    for (const actor of pedestrians?.children ?? []) {
      expect(style.sidewalkX.some((x) => Math.abs(actor.position.x - x) < 0.25)).toBe(true);
      expect(actor.position.z).toBeGreaterThanOrEqual(style.minZ);
      expect(actor.position.z).toBeLessThanOrEqual(style.maxZ);
    }
    for (const actor of cars?.children ?? []) {
      expect(style.laneX).toContain(actor.position.x);
      expect(actor.position.z).toBeGreaterThanOrEqual(style.minZ - style.carLoopPadding);
      expect(actor.position.z).toBeLessThanOrEqual(style.maxZ + style.carLoopPadding);
      const smartDriveLight = actor.getObjectByName('smart-drive-blue-light');
      expect(smartDriveLight).toBeInstanceOf(THREE.Mesh);
      expect(smartDriveLight?.visible).toBe(true);
      const lightMaterial = (smartDriveLight as THREE.Mesh).material as THREE.MeshStandardMaterial;
      expect(lightMaterial.color.getHexString()).toBe('1d8dff');
      expect(lightMaterial.emissive.getHexString()).toBe('0064ff');
      expect(smartDriveLight?.position.y).toBeGreaterThan(0.7);
    }

    const leftWalkers = (pedestrians?.children ?? []).filter((actor) => actor.position.x < 0);
    const rightWalkers = (pedestrians?.children ?? []).filter((actor) => actor.position.x > 0);
    for (const sideWalkers of [leftWalkers, rightWalkers]) {
      if (sideWalkers.length > 1) {
        expect(Math.abs(sideWalkers[0].position.z - sideWalkers[1].position.z)).toBeGreaterThan(1);
      }
    }
    life.dispose();
  });

  it('moves actors in their authored directions and wraps them inside the loop', () => {
    const life = createStreetLife({ pedestrianCount: 4, carCount: 3, seed: 42, style });
    const pedestrians = life.root.getObjectByName('Pedestrians')!;
    const cars = life.root.getObjectByName('Cars')!;
    const pedestrianBefore = pedestrians.children.map((actor) => actor.position.z);
    const carBefore = cars.children.map((actor) => actor.position.z);

    life.update(0.1);

    pedestrians.children.forEach((actor, index) => {
      const direction = index % 2 === 0 ? 1 : -1;
      expect((actor.position.z - pedestrianBefore[index]) * direction).toBeGreaterThan(0);
      expect(actor.position.z).toBeGreaterThanOrEqual(style.minZ);
      expect(actor.position.z).toBeLessThanOrEqual(style.maxZ);
    });
    cars.children.forEach((actor, index) => {
      const direction = index % 2 === 0 ? 1 : -1;
      const loopMin = style.minZ - style.carLoopPadding;
      const loopMax = style.maxZ + style.carLoopPadding;
      expect(actor.position.z).toBeGreaterThanOrEqual(loopMin);
      expect(actor.position.z).toBeLessThanOrEqual(loopMax);
      // With this short step no actor crosses the loop seam, so direction is observable directly.
      expect((actor.position.z - carBefore[index]) * direction).toBeGreaterThan(0);
    });

    life.dispose();
    life.dispose();
    expect(life.root.children).toHaveLength(0);
  });

  it('shows a head-anchored subtitle on proximity entry with re-entry and cooldown gating', () => {
    const spoken: string[] = [];
    const life = createStreetLife({
      pedestrianCount: 2,
      carCount: 3,
      seed: 42,
      style: { ...style, pedestrianSpeed: 0, carSpeed: 0 },
      greeting: {
        text: '遥遥领先',
        triggerRadius: 0.6,
        durationSeconds: 0.3,
        cooldownSeconds: 0.7,
        onSpeak: (pedestrianName) => spoken.push(pedestrianName),
      },
    });
    const pedestrians = life.root.getObjectByName('Pedestrians')!;
    const first = pedestrians.children[0];
    const second = pedestrians.children[1];
    const firstSubtitle = first.getObjectByName('pedestrian-subtitle') as THREE.Sprite;
    const secondSubtitle = second.getObjectByName('pedestrian-subtitle') as THREE.Sprite;

    expect(firstSubtitle).toBeInstanceOf(THREE.Sprite);
    expect(firstSubtitle.parent?.name).toBe('head');
    expect(firstSubtitle.visible).toBe(false);
    expect(firstSubtitle.userData.text).toBe('遥遥领先');
    expect(firstSubtitle.material.map).toBeInstanceOf(THREE.CanvasTexture);
    expect(secondSubtitle.material.map).toBe(firstSubtitle.material.map);

    // Omitted listener positions never trigger a greeting.
    life.update(0.1);
    expect(spoken).toEqual([]);

    // Y is deliberately far away: proximity is measured only on XZ.
    const firstPosition = new THREE.Vector3(first.position.x, 500, first.position.z);
    life.update(0, firstPosition);
    expect(spoken).toEqual(['Pedestrian-1']);
    expect(firstSubtitle.visible).toBe(true);

    life.update(0.2, firstPosition);
    expect(spoken).toHaveLength(1);
    life.update(0.2, firstPosition);
    expect(firstSubtitle.visible).toBe(false);
    life.update(0, firstPosition);
    expect(spoken).toHaveLength(1);

    // A second pedestrian entering during the global quiet period is gated.
    const secondPosition = new THREE.Vector3(second.position.x, -500, second.position.z);
    life.update(0, secondPosition);
    expect(spoken).toHaveLength(1);
    expect(secondSubtitle.visible).toBe(false);

    // Leave, attempt a re-entry before cooldown expiry, leave again, then re-enter.
    const farAway = new THREE.Vector3(100, 0, 100);
    life.update(0, farAway);
    life.update(0.5, farAway);
    life.update(0, firstPosition);
    expect(spoken).toHaveLength(1);
    life.update(0, farAway);
    life.update(0.2, farAway);
    life.update(0, firstPosition);
    expect(spoken).toEqual(['Pedestrian-1', 'Pedestrian-1']);
    expect(firstSubtitle.visible).toBe(true);

    life.dispose();
    life.dispose();
    expect(life.root.children).toHaveLength(0);
  });
});
