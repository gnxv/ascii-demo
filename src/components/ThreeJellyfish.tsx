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
    scene.background = new THREE.Color(0x030308);
    scene.fog = new THREE.FogExp2(0x030308, 0.045);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);

    // lights
    const ambient = new THREE.AmbientLight(0x2a2040, 0.5);
    scene.add(ambient);
    const key = new THREE.PointLight(0xcc88ff, 1.8, 40);
    key.position.set(3, 6, 8);
    scene.add(key);
    const fill = new THREE.PointLight(0x6644aa, 0.6, 30);
    fill.position.set(-4, -2, 4);
    scene.add(fill);

    const jelly = new THREE.Group();
    scene.add(jelly);

    // outer bell (translucent)
    const bellGeo = new THREE.SphereGeometry(2.2, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.52);
    const bellMat = new THREE.MeshPhysicalMaterial({
      color: 0xbb77ff,
      emissive: 0x552288,
      transparent: true,
      opacity: 0.42,
      roughness: 0.15,
      metalness: 0.05,
      transmission: 0.6,
      thickness: 0.8,
      side: THREE.DoubleSide,
    });
    const bell = new THREE.Mesh(bellGeo, bellMat);
    bell.position.y = 1.4;
    jelly.add(bell);

    // inner glow
    const glowGeo = new THREE.SphereGeometry(1.5, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.48);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xee99ff,
      transparent: true,
      opacity: 0.22,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.y = 1.3;
    jelly.add(glow);

    // radial ribs on bell
    const ribs: THREE.Mesh[] = [];
    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2;
      const points = [];
      for (let s = 0; s <= 8; s++) {
        const a = (s / 8) * Math.PI * 0.5;
        points.push(new THREE.Vector3(
          Math.cos(ang) * Math.sin(a) * 2.05,
          Math.cos(a) * 1.6 + 0.3,
          Math.sin(ang) * Math.sin(a) * 2.05
        ));
      }
      const curve = new THREE.CatmullRomCurve3(points);
      const tube = new THREE.TubeGeometry(curve, 12, 0.018, 5, false);
      const mat = new THREE.MeshBasicMaterial({ color: 0xdd99ff, transparent: true, opacity: 0.35 });
      const rib = new THREE.Mesh(tube, mat);
      ribs.push(rib);
      jelly.add(rib);
    }

    // tentacles (soft chains approximated with tubes)
    const tentacles: THREE.Mesh[] = [];
    for (let i = 0; i < 14; i++) {
      const ang = (i / 14) * Math.PI * 2;
      const points = [
        new THREE.Vector3(Math.cos(ang) * 0.6, 0.2, Math.sin(ang) * 0.6),
        new THREE.Vector3(Math.cos(ang) * 0.9, -1.4, Math.sin(ang) * 0.9),
        new THREE.Vector3(Math.cos(ang * 1.2) * 1.1, -2.8, Math.sin(ang * 1.2) * 1.1),
        new THREE.Vector3(Math.cos(ang * 0.8) * 0.7, -4.2, Math.sin(ang * 0.8) * 0.7),
        new THREE.Vector3(Math.cos(ang * 1.4) * 0.4, -5.4, Math.sin(ang * 1.4) * 0.4),
      ];
      const curve = new THREE.CatmullRomCurve3(points);
      const tube = new THREE.TubeGeometry(curve, 24, 0.028, 6, false);
      const mat = new THREE.MeshPhongMaterial({
        color: 0xaa66ee,
        emissive: 0x331166,
        transparent: true,
        opacity: 0.65,
      });
      const tent = new THREE.Mesh(tube, mat);
      tent.userData = { phase: i * 0.45, basePoints: points.map(p => p.clone()) };
      tentacles.push(tent);
      jelly.add(tent);
    }

    // dust
    const dustCount = 280;
    const dustGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 24;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const dustMat = new THREE.PointsMaterial({ color: 0xb0c8ff, size: 0.025, transparent: true, opacity: 0.35 });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    let t = 0;
    let raf = 0;
    const mouse = { x: 0, y: 0 };

    const onMove = (e: MouseEvent) => {
      const r = mount.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    };
    mount.addEventListener("mousemove", onMove);

    const animate = () => {
      t += 0.016;
      const pulse = 1 + Math.sin(t * 1.5) * 0.07;
      bell.scale.set(pulse, 1 + Math.sin(t * 1.5) * 0.03, pulse);
      glow.scale.setScalar(pulse * 0.96);

      jelly.position.y = Math.sin(t * 0.35) * 0.5;
      jelly.rotation.y = Math.sin(t * 0.12) * 0.4 + mouse.x * 0.3;
      jelly.rotation.x = mouse.y * 0.15;

      tentacles.forEach((tent, i) => {
        tent.rotation.z = Math.sin(t * 1.1 + tent.userData.phase) * 0.18;
        tent.rotation.x = Math.cos(t * 0.85 + tent.userData.phase) * 0.12;
      });

      dust.rotation.y = t * 0.015;
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
      mount.removeEventListener("mousemove", onMove);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
}
