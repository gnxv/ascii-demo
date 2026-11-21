"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeFishes() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x041830);
    scene.fog = new THREE.FogExp2(0x041830, 0.016);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 200);
    camera.position.set(0, 2, 38);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x336688, 0.7);
    scene.add(ambient);
    const light = new THREE.DirectionalLight(0xaaddff, 0.9);
    light.position.set(8, 15, 10);
    scene.add(light);

    // better fish shape: body + tail + fins
    function createFish() {
      const group = new THREE.Group();

      // body
      const bodyGeo = new THREE.SphereGeometry(0.45, 12, 10);
      bodyGeo.scale(1.8, 0.7, 0.55);
      const bodyMat = new THREE.MeshPhongMaterial({
        color: 0x4db8ff,
        emissive: 0x0a3355,
        shininess: 60,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      group.add(body);

      // tail
      const tailGeo = new THREE.ConeGeometry(0.28, 0.7, 5);
      tailGeo.rotateZ(Math.PI / 2);
      tailGeo.translate(-1.1, 0, 0);
      const tail = new THREE.Mesh(tailGeo, bodyMat);
      group.add(tail);

      // dorsal fin
      const finGeo = new THREE.ConeGeometry(0.15, 0.45, 4);
      finGeo.rotateZ(Math.PI);
      finGeo.translate(0.1, 0.45, 0);
      const fin = new THREE.Mesh(finGeo, bodyMat);
      group.add(fin);

      return group;
    }

    const fishes: THREE.Group[] = [];
    for (let i = 0; i < 45; i++) {
      const fish = createFish();
      fish.position.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 18,
        (Math.random() - 0.5) * 30
      );
      fish.userData = {
        speed: 0.35 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        radius: 6 + Math.random() * 14,
        yAmp: 1.5 + Math.random() * 3,
        wave: Math.random() * 2,
      };
      fishes.push(fish);
      scene.add(fish);
    }

    let t = 0;
    let raf = 0;

    const animate = () => {
      t += 0.016;
      fishes.forEach((fish) => {
        const u = fish.userData;
        const angle = t * u.speed + u.phase;
        fish.position.x = Math.cos(angle) * u.radius;
        fish.position.z = Math.sin(angle) * u.radius * 0.7;
        fish.position.y = Math.sin(t * 0.5 + u.phase) * u.yAmp;
        fish.rotation.y = -angle + Math.PI / 2;

        // body wave
        const wave = Math.sin(t * 4 + u.wave) * 0.25;
        fish.rotation.z = wave * 0.3;
        if (fish.children[1]) {
          fish.children[1].rotation.y = Math.sin(t * 7 + u.phase) * 0.5;
        }
      });
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
