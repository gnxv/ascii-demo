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
    scene.background = new THREE.Color(0x010108);
    scene.fog = new THREE.FogExp2(0x010108, 0.025);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.3, 13);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x1a1028, 0.4);
    scene.add(ambient);
    const key = new THREE.PointLight(0xeeaaff, 2.4, 50);
    key.position.set(1, 5, 7);
    scene.add(key);
    const rim = new THREE.PointLight(0x6644aa, 0.8, 30);
    rim.position.set(-4, -1, -4);
    scene.add(rim);

    const jelly = new THREE.Group();
    scene.add(jelly);

    // Flatter bell with more pronounced rim
    const bellGeo = new THREE.SphereGeometry(2.6, 64, 36, 0, Math.PI * 2, 0, Math.PI * 0.42);
    const bellMat = new THREE.MeshPhysicalMaterial({
      color: 0xcc77ff,
      emissive: 0x662299,
      transparent: true,
      opacity: 0.38,
      roughness: 0.08,
      transmission: 0.65,
      thickness: 1.2,
      side: THREE.DoubleSide,
    });
    const bell = new THREE.Mesh(bellGeo, bellMat);
    bell.position.y = 1.6;
    jelly.add(bell);

    // Stronger inner glow
    const glowGeo = new THREE.SphereGeometry(1.7, 40, 28, 0, Math.PI * 2, 0, Math.PI * 0.38);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xff99ff, transparent: true, opacity: 0.32 });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.y = 1.5;
    jelly.add(glow);

    // Thin tentacles from rim
    const tentacles: THREE.Mesh[] = [];
    for (let i = 0; i < 48; i++) {
      const ang = (i / 48) * Math.PI * 2;
      const len = 5.5 + (i % 7) * 0.3;
      const points = [
        new THREE.Vector3(Math.cos(ang) * 2.2, 0.2, Math.sin(ang) * 2.2),
        new THREE.Vector3(Math.cos(ang) * 1.8, -1.4, Math.sin(ang) * 1.8),
        new THREE.Vector3(Math.cos(ang * 1.05) * 1.2, -2.8, Math.sin(ang * 1.05) * 1.2),
        new THREE.Vector3(Math.cos(ang * 0.95) * 0.6, -4.2, Math.sin(ang * 0.95) * 0.6),
        new THREE.Vector3(Math.cos(ang * 1.1) * 0.25, -len, Math.sin(ang * 1.1) * 0.25),
      ];
      const curve = new THREE.CatmullRomCurve3(points);
      const tube = new THREE.TubeGeometry(curve, 36, 0.018, 5, false);
      const mat = new THREE.MeshPhongMaterial({
        color: 0xbb66ee,
        emissive: 0x442266,
        transparent: true,
        opacity: 0.6,
      });
      const tent = new THREE.Mesh(tube, mat);
      tent.userData = { phase: i * 0.28 };
      tentacles.push(tent);
      jelly.add(tent);
    }

    // Thicker central oral arms
    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2;
      const points = [
        new THREE.Vector3(Math.cos(ang) * 0.3, 0.1, Math.sin(ang) * 0.3),
        new THREE.Vector3(Math.cos(ang) * 0.5, -1.6, Math.sin(ang) * 0.5),
        new THREE.Vector3(Math.cos(ang * 1.1) * 0.35, -3.2, Math.sin(ang * 1.1) * 0.35),
        new THREE.Vector3(Math.cos(ang * 0.9) * 0.15, -4.4, Math.sin(ang * 0.9) * 0.15),
      ];
      const curve = new THREE.CatmullRomCurve3(points);
      const tube = new THREE.TubeGeometry(curve, 20, 0.04, 6, false);
      const mat = new THREE.MeshPhongMaterial({
        color: 0xdd99ff,
        emissive: 0x663399,
        transparent: true,
        opacity: 0.75,
      });
      jelly.add(new THREE.Mesh(tube, mat));
    }

    // denser dust
    const dustCount = 320;
    const dustGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xc8d8ff, size: 0.022, transparent: true, opacity: 0.35 }));
    scene.add(dust);

    let t = 0;
    let raf = 0;

    const animate = () => {
      t += 0.016;
      // wave-like pulse (stronger on rim)
      const pulse = 1 + Math.sin(t * 1.4) * 0.05;
      const rimPulse = 1 + Math.sin(t * 1.4 + 0.4) * 0.08;
      bell.scale.set(rimPulse, pulse, rimPulse);
      glow.scale.setScalar(pulse * 0.96);

      jelly.position.y = Math.sin(t * 0.28) * 0.35;
      jelly.rotation.y = Math.sin(t * 0.08) * 0.25;

      tentacles.forEach((tent) => {
        tent.rotation.z = Math.sin(t * 0.95 + tent.userData.phase) * 0.1;
        tent.rotation.x = Math.cos(t * 0.75 + tent.userData.phase) * 0.07;
      });

      dust.rotation.y = t * 0.006;
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
