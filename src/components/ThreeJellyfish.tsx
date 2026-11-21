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
    scene.background = new THREE.Color(0x020206);
    scene.fog = new THREE.FogExp2(0x020206, 0.035);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 13);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x3a2858, 0.55);
    scene.add(ambient);
    const key = new THREE.PointLight(0xdd99ff, 2.2, 50);
    key.position.set(2, 5, 7);
    scene.add(key);
    const rim = new THREE.PointLight(0x8866cc, 0.9, 30);
    rim.position.set(-5, -1, -3);
    scene.add(rim);

    const jelly = new THREE.Group();
    scene.add(jelly);

    // outer bell
    const bellGeo = new THREE.SphereGeometry(2.4, 64, 40, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const bellMat = new THREE.MeshPhysicalMaterial({
      color: 0xcc88ff,
      emissive: 0x6633aa,
      transparent: true,
      opacity: 0.48,
      roughness: 0.12,
      metalness: 0.04,
      transmission: 0.55,
      thickness: 1.1,
      side: THREE.DoubleSide,
    });
    const bell = new THREE.Mesh(bellGeo, bellMat);
    bell.position.y = 1.5;
    jelly.add(bell);

    // inner glow
    const glowGeo = new THREE.SphereGeometry(1.65, 40, 28, 0, Math.PI * 2, 0, Math.PI * 0.46);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffaaff, transparent: true, opacity: 0.28 });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.y = 1.4;
    jelly.add(glow);

    // denser radial ribs
    for (let i = 0; i < 28; i++) {
      const ang = (i / 28) * Math.PI * 2;
      const points = [];
      for (let s = 0; s <= 10; s++) {
        const a = (s / 10) * Math.PI * 0.48;
        points.push(new THREE.Vector3(
          Math.cos(ang) * Math.sin(a) * 2.25,
          Math.cos(a) * 1.75 + 0.25,
          Math.sin(ang) * Math.sin(a) * 2.25
        ));
      }
      const curve = new THREE.CatmullRomCurve3(points);
      const tube = new THREE.TubeGeometry(curve, 16, 0.014, 5, false);
      const mat = new THREE.MeshBasicMaterial({ color: 0xeebbff, transparent: true, opacity: 0.4 });
      jelly.add(new THREE.Mesh(tube, mat));
    }

    // many tentacles
    const tentacles: THREE.Mesh[] = [];
    for (let i = 0; i < 36; i++) {
      const ang = (i / 36) * Math.PI * 2 + (i % 3) * 0.1;
      const len = 4.8 + (i % 5) * 0.4;
      const points = [
        new THREE.Vector3(Math.cos(ang) * 0.5, 0.15, Math.sin(ang) * 0.5),
        new THREE.Vector3(Math.cos(ang) * 0.85, -1.2, Math.sin(ang) * 0.85),
        new THREE.Vector3(Math.cos(ang * 1.15) * 1.05, -2.4, Math.sin(ang * 1.15) * 1.05),
        new THREE.Vector3(Math.cos(ang * 0.9) * 0.75, -3.6, Math.sin(ang * 0.9) * 0.75),
        new THREE.Vector3(Math.cos(ang * 1.3) * 0.45, -len, Math.sin(ang * 1.3) * 0.45),
      ];
      const curve = new THREE.CatmullRomCurve3(points);
      const tube = new THREE.TubeGeometry(curve, 28, 0.022, 6, false);
      const mat = new THREE.MeshPhongMaterial({
        color: 0xbb77ee,
        emissive: 0x442277,
        transparent: true,
        opacity: 0.72,
      });
      const tent = new THREE.Mesh(tube, mat);
      tent.userData = { phase: i * 0.35 };
      tentacles.push(tent);
      jelly.add(tent);
    }

    // oral arms (thicker central)
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2;
      const points = [
        new THREE.Vector3(Math.cos(ang) * 0.25, 0, Math.sin(ang) * 0.25),
        new THREE.Vector3(Math.cos(ang) * 0.5, -1.8, Math.sin(ang) * 0.5),
        new THREE.Vector3(Math.cos(ang * 1.1) * 0.35, -3.2, Math.sin(ang * 1.1) * 0.35),
      ];
      const curve = new THREE.CatmullRomCurve3(points);
      const tube = new THREE.TubeGeometry(curve, 16, 0.045, 6, false);
      const mat = new THREE.MeshPhongMaterial({ color: 0xdd99ff, emissive: 0x553388, transparent: true, opacity: 0.8 });
      jelly.add(new THREE.Mesh(tube, mat));
    }

    // dense dust
    const dustCount = 420;
    const dustGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 26;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const dustMat = new THREE.PointsMaterial({ color: 0xc8d8ff, size: 0.028, transparent: true, opacity: 0.4 });
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
      const pulse = 1 + Math.sin(t * 1.45) * 0.065;
      bell.scale.set(pulse, 1 + Math.sin(t * 1.45) * 0.025, pulse);
      glow.scale.setScalar(pulse * 0.97);

      jelly.position.y = Math.sin(t * 0.32) * 0.45;
      jelly.rotation.y = Math.sin(t * 0.1) * 0.35 + mouse.x * 0.25;
      jelly.rotation.x = mouse.y * 0.12;

      tentacles.forEach((tent) => {
        tent.rotation.z = Math.sin(t * 1.05 + tent.userData.phase) * 0.16;
        tent.rotation.x = Math.cos(t * 0.8 + tent.userData.phase) * 0.1;
      });

      dust.rotation.y = t * 0.012;
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
