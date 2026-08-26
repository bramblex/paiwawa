import * as THREE from 'three';

import type { ScreenPoint, ScreenRect, ViewportSize } from './alignment';

const toScreen = (point: THREE.Vector3, viewport: ViewportSize): THREE.Vector3 =>
  new THREE.Vector3(
    (point.x * 0.5 + 0.5) * viewport.width,
    (1 - (point.y * 0.5 + 0.5)) * viewport.height,
    point.z,
  );

export function projectWorldPoint(
  worldPoint: THREE.Vector3,
  camera: THREE.PerspectiveCamera,
  viewport: ViewportSize,
): ScreenPoint {
  camera.updateMatrixWorld();
  const cameraSpace = worldPoint.clone().applyMatrix4(camera.matrixWorldInverse);
  const projected = toScreen(worldPoint.clone().project(camera), viewport);
  const inDepth = cameraSpace.z < -camera.near && projected.z >= -1 && projected.z <= 1;

  return {
    x: projected.x,
    y: projected.y,
    visible:
      inDepth &&
      projected.x >= 0 &&
      projected.x <= viewport.width &&
      projected.y >= 0 &&
      projected.y <= viewport.height,
  };
}

export function projectObjectPoint(
  object: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  viewport: ViewportSize,
): ScreenPoint {
  object.updateWorldMatrix(true, false);
  return projectWorldPoint(object.getWorldPosition(new THREE.Vector3()), camera, viewport);
}

export function projectObjectBounds(
  object: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  viewport: ViewportSize,
): ScreenRect {
  object.updateWorldMatrix(true, true);
  camera.updateMatrixWorld();

  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) {
    return { left: 0, top: 0, right: 0, bottom: 0, visible: false };
  }

  const { min, max } = box;
  const corners = [
    new THREE.Vector3(min.x, min.y, min.z),
    new THREE.Vector3(min.x, min.y, max.z),
    new THREE.Vector3(min.x, max.y, min.z),
    new THREE.Vector3(min.x, max.y, max.z),
    new THREE.Vector3(max.x, min.y, min.z),
    new THREE.Vector3(max.x, min.y, max.z),
    new THREE.Vector3(max.x, max.y, min.z),
    new THREE.Vector3(max.x, max.y, max.z),
  ];

  let pointsInFront = 0;
  const screenPoints = corners.map((corner) => {
    const cameraSpace = corner.clone().applyMatrix4(camera.matrixWorldInverse);
    if (cameraSpace.z < -camera.near) pointsInFront += 1;
    return toScreen(corner.project(camera), viewport);
  });

  const left = Math.min(...screenPoints.map((point) => point.x));
  const right = Math.max(...screenPoints.map((point) => point.x));
  const top = Math.min(...screenPoints.map((point) => point.y));
  const bottom = Math.max(...screenPoints.map((point) => point.y));
  const intersectsViewport =
    right > 0 && left < viewport.width && bottom > 0 && top < viewport.height;

  return {
    left,
    top,
    right,
    bottom,
    visible: pointsInFront === corners.length && intersectsViewport,
  };
}
