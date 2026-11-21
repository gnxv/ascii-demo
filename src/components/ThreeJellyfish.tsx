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
    scene.background = new THREE.Color(0x04040a);
    scene.fog = new THREE.Fog(0x04040a, 8, 28);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // lights
    const ambient = new THREE.AmbientLight(0x404060, 0.6);
    scene.add(ambient);
    const point = new THREE.PointLight(0xaa77ff, 1.2, 30);
    point.position.set(2, 4, 6);
    scene.add(point);

    // jellyfish group
    const jelly = new THREE.Group();
    scene.add(jelly);

    // bell
    const bellGeo = new THREE.SphereGeometry(1.6, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const bellMat = new THREE.MeshPhongMaterial({
      color: 0xbb88ff,
      emissive: 0x442266,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      shininess: 40,
    });
    const bell = new THREE.Mesh(bellGeo, bellMat);
    bell.position.y = 1.2;
    jelly.add(bell);

    // inner glow
    const glowGeo = new THREE.SphereGeometry(1.1, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xdd99ff,
      transparent: true,
      opacity: 0.25,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.y = 1.1;
    jelly.add(glow);

    // tentacles as curves
    const tentacles: THREE.Mesh[] = [];
    for (let i = 0; i < 12; i++) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(Math.sin(i) * 0.4, -1.2, Math.cos(i) * 0.4),
        new THREE.Vector3(Math.sin(i * 1.3) * 0.8, -2.4, Math.cos(i * 1.3) * 0.8),
        new THREE.Vector3(Math.sin(i * 0.7) * 0.5, -3.6, Math.cos(i * 0.7) * 0.5),
      ]);
      const tube = new THREE.TubeGeometry(curve, 20, 0.035, 6, false);
      const mat = new THREE.MeshPhongMaterial({
        color: 0x9966ee,
        emissive: 0x331155,
        transparent: true,
        opacity: 0.7,
      });
      const tent = new THREE.Mesh(tube, mat);
      tent.userData = { phase: i * 0.5, baseCurve: curve };
      tentacles.push(tent);
      jelly.add(tent);
    }

    // dust particles
    const dustCount = 200;
    const dustGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const dustMat = new THREE.PointsMaterial({ color: 0xaaccff, size: 0.03, transparent: true, opacity: 0.4 });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    let t = 0;
    let raf = 0;

    const animate = () => {
      t += 0.016;
      const pulse = 1 + Math.sin(t * 1.6) * 0.08;
      bell.scale.set(pulse, 1 + Math.sin(t * 1.6) * 0.04, pulse);
      glow.scale.setScalar(pulse * 0.95);

      jelly.position.y = Math.sin(t * 0.4) * 0.4;
      jelly.rotation.y = Math.sin(t * 0.15) * 0.3;

      tentacles.forEach((tent, i) => {
        tent.rotation.z = Math.sin(t * 1.2 + tent.userData.phase) * 0.15;
        tent.rotation.x = Math.cos(t * 0.9 + tent.userData.phase) * 0.1;
      });

      dust.rotation.y = t * 0.02;
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
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
}
