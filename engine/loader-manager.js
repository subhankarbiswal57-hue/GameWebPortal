import * as THREE from 'three';

export function createLoaderManager({ onProgress, onDone } = {}) {
  const manager = new THREE.LoadingManager();
  manager.onProgress = (_url, loaded, total) => onProgress?.(loaded / total);
  manager.onLoad = () => onDone?.();
  return manager;
}
