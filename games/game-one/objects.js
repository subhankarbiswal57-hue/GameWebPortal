import * as THREE from 'three';

export function createPlayer() {
  const geo = new THREE.SphereGeometry(0.5, 16, 16);
  const mat = new THREE.MeshStandardMaterial({ color: 0x1fb6ff });
  return new THREE.Mesh(geo, mat);
}

export function createObstacleFactory(pool) {
  return () => pool.acquire();
}

export function makeObstacleTemplate() {
  const geo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  const mat = new THREE.MeshStandardMaterial({ color: 0xff5a1f });
  return () => new THREE.Mesh(geo, mat);
}
