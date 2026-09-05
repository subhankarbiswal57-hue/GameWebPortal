import * as THREE from 'three';

// Thin helper over THREE.LOD: pass [{geometry, material, distance}, ...]
export function buildLOD(levels) {
  const lod = new THREE.LOD();
  for (const { geometry, material, distance } of levels) {
    lod.addLevel(new THREE.Mesh(geometry, material), distance);
  }
  return lod;
}
