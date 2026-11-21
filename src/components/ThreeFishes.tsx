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
    scene.fog = new THREE.FogExp2(0x041830, 0.014);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 220);
    camera.position.set(0, 3, 42);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x336688, 0.65);
    scene.add(ambient);
    const light = new THREE.DirectionalLight(0xaaddff, 0.85);
    light.position.set(10, 18, 12);
    scene.add(light);

    function createFish() {
      const group = new THREE.Group();

      const bodyGeo = new THREE.SphereGeometry(0.5, 14, 10);
      bodyGeo.scale(2.1, 0.62, 0.48);
      const mat = new THREE.MeshPhongMaterial({
        color: 0x4db8ff,
        emissive: 0x0a3355,
        shininess: 55,
      });
      const body = new THREE.Mesh(bodyGeo, mat);
      group.add(body);

      const tailGeo = new THREE.ConeGeometry(0.32, 0.75, 5);
      tailGeo.rotateZ(Math.PI / 2);
      tailGeo.translate(-1.25, 0, 0);
      const tail = new THREE.Mesh(tailGeo, mat);
      group.add(tail);

      const finGeo = new THREE.ConeGeometry(0.16, 0.4, 4);
      finGeo.rotateZ(Math.PI);
      finGeo.translate(0.15, 0.42, 0);
      const fin = new THREE.Mesh(finGeo, mat);
      group.add(fin);

      return group;
    }

    const fishes: THREE.Group[] = [];
    for (let i = 0; i < 38; i++) {
      const fish = createFish();
      fish.position.set(
        (Math.random() - 0.5) * 36,
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 28
      );
      fish.userData = {
        speed: 0.18 + Math.random() * 0.55,
        phase: Math.random() * Math.PI * 2,
        radius: 5 + Math.random() * 16,
        yAmp: 1.2 + Math.random() * 3.5,
        wave: Math.random() * 3,
        drift: (Math.random() - 0.5) * 0.4,
        targetSpeed: 0.3 + Math.random() * 0.4,
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
        // occasional speed change
        if (Math.random() < 0.008) {
          u.targetSpeed = 0.15 + Math.random() * 0.6;
        }
        u.speed += (u.targetSpeed - u.speed) * 0.02;

        const angle = t * u.speed * 1.4 + u.phase;
        const wobble = Math.sin(t * 0.7 + u.phase) * u.drift;
        fish.position.x = Math.cos(angle) * u.radius + wobble * 4;
        fish.position.z = Math.sin(angle * 0.85) * u.radius * 0.65 + wobble * 2;
        fish.position.y = Math.sin(t * 0.45 + u.phase) * u.yAmp + Math.sin(t * 1.2 + u.wave) * 0.6;
        fish.rotation.y = -angle + Math.PI / 2 + wobble * 0.4;

        // body bend
        const bend = Math.sin(t * 3.5 + u.wave) * 0.35;
        fish.rotation.z = bend * 0.25;
        if (fish.children[1]) {
          fish.children[1].rotation.y = Math.sin(t * 6 + u.phase) * 0.55;
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
