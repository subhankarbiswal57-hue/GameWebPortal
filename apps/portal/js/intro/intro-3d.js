import * as THREE from 'three';
import { sound } from './shared/audio.js';

export function init3DIntro(onComplete) {
  const introContainer = document.getElementById('intro-screen');
  const canvas = document.getElementById('intro-canvas');
  if (!introContainer || !canvas) {
    if (onComplete) onComplete();
    return;
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x090a0d, 0.035);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 14);

  // Lights
  const ambient = new THREE.AmbientLight(0xd4af37, 0.8);
  scene.add(ambient);

  const pointLight = new THREE.PointLight(0xffaa00, 3, 50);
  pointLight.position.set(0, 4, 10);
  scene.add(pointLight);

  const cursedLight = new THREE.PointLight(0x00ffcc, 2, 40);
  cursedLight.position.set(0, -6, 5);
  scene.add(cursedLight);

  // 3D Ancient Aztec Gold Medallion / Skull Emblem Group
  const emblemGroup = new THREE.Group();
  scene.add(emblemGroup);

  // Giant Golden Medallion Ring with Relic Runes
  const outerRingGeo = new THREE.TorusGeometry(3.6, 0.35, 24, 64);
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.25,
    metalness: 0.95,
    emissive: 0x553a06,
    emissiveIntensity: 0.3
  });
  const outerRing = new THREE.Mesh(outerRingGeo, goldMat);
  emblemGroup.add(outerRing);

  // Inner Ornate Star / Compass
  const innerRings = new THREE.TorusGeometry(2.4, 0.18, 16, 48);
  const innerMat = new THREE.MeshStandardMaterial({
    color: 0xcd7f32,
    roughness: 0.3,
    metalness: 0.9
  });
  const ringMesh2 = new THREE.Mesh(innerRings, innerMat);
  emblemGroup.add(ringMesh2);

  // Aztec Gold Medallion Center Plate
  const plateGeo = new THREE.CylinderGeometry(2.35, 2.35, 0.3, 32);
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0xb8860b,
    roughness: 0.4,
    metalness: 0.85
  });
  const plate = new THREE.Mesh(plateGeo, plateMat);
  plate.rotation.x = Math.PI / 2;
  emblemGroup.add(plate);

  // Crossed Pirate Cutlasses in 3D
  const swordGeo = new THREE.BoxGeometry(0.2, 7.8, 0.1);
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    metalness: 0.98,
    roughness: 0.15
  });
  const sword1 = new THREE.Mesh(swordGeo, bladeMat);
  sword1.rotation.z = Math.PI / 4;
  sword1.position.z = -0.3;
  emblemGroup.add(sword1);

  const sword2 = new THREE.Mesh(swordGeo, bladeMat);
  sword2.rotation.z = -Math.PI / 4;
  sword2.position.z = -0.3;
  emblemGroup.add(sword2);

  // Floating Mystic Embers / Gold Dust Particles
  const particleGeo = new THREE.BufferGeometry();
  const particleCount = 280;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 35;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 25;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20;

    colors[i * 3] = 0.95 + Math.random() * 0.05; // Gold / Ember
    colors[i * 3 + 1] = 0.7 + Math.random() * 0.25;
    colors[i * 3 + 2] = 0.1;
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const particleMat = new THREE.PointsMaterial({
    size: 0.22,
    vertexColors: true,
    transparent: true,
    opacity: 0.85
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', resize);

  let startTime = performance.now();
  let rafId = null;
  let hasTransitioned = false;

  const enterPortalBtn = document.getElementById('enter-portal-btn');
  if (enterPortalBtn) {
    enterPortalBtn.addEventListener('click', () => {
      sound.init();
      sound.playVictory();
      triggerTransition();
    });
  }

  function triggerTransition() {
    if (hasTransitioned) return;
    hasTransitioned = true;
    introContainer.classList.add('fade-out');
    setTimeout(() => {
      introContainer.classList.add('hidden');
      if (rafId) cancelAnimationFrame(rafId);
      renderer.dispose();
      if (onComplete) onComplete();
    }, 900);
  }

  function animate(t) {
    const elapsed = (t - startTime) * 0.001;

    emblemGroup.rotation.y = Math.sin(elapsed * 0.7) * 0.45;
    emblemGroup.rotation.x = Math.cos(elapsed * 0.5) * 0.25;
    emblemGroup.rotation.z = Math.sin(elapsed * 0.3) * 0.15;

    // Pulse lights
    pointLight.intensity = 2.5 + Math.sin(elapsed * 4) * 0.8;
    cursedLight.intensity = 1.8 + Math.cos(elapsed * 3) * 0.6;

    // Float particles upward
    const posArr = particleGeo.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      posArr[i * 3 + 1] += 0.03;
      if (posArr[i * 3 + 1] > 12) posArr[i * 3 + 1] = -12;
    }
    particleGeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
    rafId = requestAnimationFrame(animate);
  }

  rafId = requestAnimationFrame(animate);
}
