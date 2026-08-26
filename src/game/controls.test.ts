import { describe, expect, it } from 'vitest';
import * as THREE from 'three';

import { FirstPersonControls } from './controls';

function makeControls(options: ConstructorParameters<typeof FirstPersonControls>[1] = {}) {
  const camera = new THREE.PerspectiveCamera();
  camera.position.set(0, 1.65, 0);
  const controls = new FirstPersonControls(camera, { moveSpeed: 1, maxDelta: 1, ...options });
  return { camera, controls };
}

describe('FirstPersonControls camera-relative movement', () => {
  it('moves forward/backward along the camera yaw', () => {
    const { camera, controls } = makeControls();
    controls.lookAt(new THREE.Vector3(0, 1.65, -1));
    controls.setTouchMove(0, 1);
    controls.update(1);
    expect(camera.position.x).toBeCloseTo(0);
    expect(camera.position.z).toBeCloseTo(-1);

    controls.setTouchMove(0, -1);
    controls.update(1);
    expect(camera.position.z).toBeCloseTo(0);
    controls.dispose();
  });

  it('moves sideways relative to a rotated camera', () => {
    const { camera, controls } = makeControls();
    controls.lookAt(new THREE.Vector3(-1, 1.65, 0)); // yaw +PI/2, forward is world -X
    controls.setTouchMove(0, 1);
    controls.update(1);
    expect(camera.position.x).toBeCloseTo(-1);
    expect(camera.position.z).toBeCloseTo(0);

    controls.setTouchMove(1, 0);
    controls.update(1);
    expect(camera.position.z).toBeCloseTo(-1);
    controls.dispose();
  });

  it('keeps movement on the ground when the camera is pitched', () => {
    const { camera, controls } = makeControls({ cameraHeight: 1.65 });
    controls.lookAt(new THREE.Vector3(0, 3.65, -1));
    controls.setTouchMove(0, 1);
    controls.update(1);
    expect(camera.position.z).toBeCloseTo(-1);
    expect(camera.position.y).toBeCloseTo(1.65);
    controls.dispose();
  });

  it('normalizes diagonal input and respects bounds and delta safety', () => {
    const { camera, controls } = makeControls({ bounds: { minX: -0.5, maxX: 0.5, minZ: -0.5, maxZ: 0.5 } });
    controls.lookAt(new THREE.Vector3(0, 1.65, -1));
    controls.setTouchMove(1, 1);
    controls.update(1);
    expect(camera.position.x).toBeCloseTo(0.5);
    expect(camera.position.z).toBeCloseTo(-0.5);

    controls.setTouchMove(Number.NaN, Number.POSITIVE_INFINITY);
    controls.update(Number.NaN);
    expect(camera.position.x).toBeCloseTo(0.5);
    expect(camera.position.z).toBeCloseTo(-0.5);
    controls.dispose();
  });

  it('updates bounds and clears held touch movement between levels', () => {
    const { camera, controls } = makeControls();
    camera.position.set(8, 1.65, 8);
    controls.setBounds({ minX: -2, maxX: 2, minZ: -3, maxZ: 3 });
    expect(camera.position.x).toBe(2);
    expect(camera.position.z).toBe(3);

    controls.setTouchMove(0, 1);
    controls.clearMovement();
    controls.update(1);
    expect(camera.position.x).toBe(2);
    expect(camera.position.z).toBe(3);
    controls.dispose();
  });

  it('layers gyro aiming over touch look and keeps movement camera-relative', () => {
    const { camera, controls } = makeControls();
    controls.lookAt(new THREE.Vector3(0, 1.65, -1));
    controls.setGyroOffset(Math.PI / 2, 0);
    controls.setTouchMove(0, 1);
    controls.update(1);
    expect(camera.position.x).toBeCloseTo(-1);
    expect(camera.position.z).toBeCloseTo(0);

    controls.rotateBy(40, 0);
    expect(camera.rotation.y).not.toBeCloseTo(Math.PI / 2);
    controls.dispose();
  });

  it('clears gyro offsets when lookAt resets the authored camera anchor', () => {
    const { camera, controls } = makeControls();
    controls.setGyroOffset(Math.PI / 2, Math.PI / 3);
    controls.lookAt(new THREE.Vector3(0, 1.65, -1));
    expect(camera.rotation.x).toBeCloseTo(0);
    expect(camera.rotation.y).toBeCloseTo(0);
    controls.dispose();
  });
});
