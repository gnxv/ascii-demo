"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeJellyfish() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x03030a);
    scene.fog = new THREE.FogExp2(0x03030a, 0.028);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x2a2048, 0.7);
    scene.add(ambient);
    const light = new THREE.PointLight(0xdd99ff, 1.8, 40);
    light.position.set(1, 4, 6);
    scene.add(light);

    const jelly = new THREE.Group();
    scene.add(jelly);

    // Bell — clear dome
    const bellGeo = new THREE.SphereGeometry(1.8, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const bellMat = new THREE.MeshPhysicalMaterial({
      color: 0xbb88ff,
      emissive: 0x552288,
      transparent: true,
      opacity: 0.5,
      roughness: 0.1,
      transmission: 0.5,
      thickness: 0.9,
      side: THREE.DoubleSide,
    });
    const bell = new THREE.Mesh(bellGeo, bellMat);
    bell.position.y = 1.2;
    jelly.add(bell);

    // Inner glow
    const glowGeo = new THREE.SphereGeometry(1.2, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.45);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffaaff, transparent: true, opacity: 0.25 });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.y = 1.1;
    jelly.add(glow);

    // Tentacles hanging from the rim
    const tentacles: THREE.Mesh[] = [];
    const count = 24;
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2;
      const points = [
        new THREE.Vector3(Math.cos(ang) * 1.55, 0.15, Math.sin(ang) * 1.55),
        new THREE.Vector3(Math.cos(ang) * 1.4, -1.2, Math.sin(ang) * 1.4),
        new THREE.Vector3(Math.cos(ang) * 1.1, -2.6, Math.sin(ang) * 1.1),
        new THREE.Vector3(Math.cos(ang * 1.05) * 0.7, -4.0, Math.sin(ang * 1.05) * 0.7),
        new THREE.Vector3(Math.cos(ang * 0.95) * 0.3, -5.2, Math.sin(ang * 0.95) * 0.3),
      ];
      const curve = new THREE.CatmullRomCurve3(points);
      const tube = new THREE.TubeGeometry(curve, 32, 0.03, 6, false);
      const mat = new THREE.MeshPhongMaterial({
        color: 0xaa66ee,
        emissive: 0x331155,
        transparent: true,
        opacity: 0.7,
      });
      const tent = new THREE.Mesh(tube, mat);
      tent.userData = { phase: i * 0.4, base: points.map(p => p.clone()) };
      tentacles.push(tent);
      jelly.add(tent);
    }

    // dust
    const dustCount = 160;
    const dustGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xb0c8ff, size: 0.025, transparent: true, opacity: 0.3 }));
    scene.add(dust);

    let t = 0;
    let raf = 0;

    const animate = () => {
      t += 0.016;
      const pulse = 1 + Math.sin(t * 1.5) * 0.06;
      bell.scale.set(pulse, 1 + Math.sin(t * 1.5) * 0.03, pulse);
      glow.scale.setScalar(pulse * 0.95);

      jelly.position.y = Math.sin(t * 0.3) * 0.3;
      jelly.rotation.y = Math.sin(t * 0.1) * 0.2;

      tentacles.forEach((tent, i) => {
        tent.rotation.z = Math.sin(t * 1.0 + tent.userData.phase) * 0.12;
        tent.rotation.x = Math.cos(t * 0.8 + tent.userData.phase) * 0.08;
      });

      dust.rotation.y = t * 0.008;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
}
