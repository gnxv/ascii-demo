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
    scene.background = new THREE.Color(0x031f48);
    scene.fog = new THREE.FogExp2(0x031f48, 0.018);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200);
    camera.position.set(0, 0, 40);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x4488aa, 0.6);
    scene.add(ambient);
    const light = new THREE.DirectionalLight(0xaaccff, 0.8);
    light.position.set(10, 20, 10);
    scene.add(light);

    // simple fish geometry (cone + body)
    const bodyGeo = new THREE.ConeGeometry(0.35, 1.4, 6);
    bodyGeo.rotateX(Math.PI / 2);
    const tailGeo = new THREE.ConeGeometry(0.25, 0.6, 4);
    tailGeo.rotateX(-Math.PI / 2);
    tailGeo.translate(0, 0, -0.9);

    const fishMat = new THREE.MeshPhongMaterial({
      color: 0x66ccff,
      emissive: 0x113355,
      shininess: 40,
    });

    const fishes: THREE.Group[] = [];
    const count = 60;
    for (let i = 0; i < count; i++) {
      const fish = new THREE.Group();
      const body = new THREE.Mesh(bodyGeo, fishMat);
      const tail = new THREE.Mesh(tailGeo, fishMat);
      fish.add(body);
      fish.add(tail);
      fish.position.set(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 40
      );
      fish.userData = {
        speed: 0.04 + Math.random() * 0.06,
        phase: Math.random() * Math.PI * 2,
        radius: 8 + Math.random() * 18,
        yAmp: 2 + Math.random() * 4,
      };
      fishes.push(fish);
      scene.add(fish);
    }

    let t = 0;
    let raf = 0;

    const animate = () => {
      t += 0.016;
      fishes.forEach((fish, i) => {
        const u = fish.userData;
        const angle = t * u.speed * 8 + u.phase;
        fish.position.x = Math.cos(angle) * u.radius;
        fish.position.z = Math.sin(angle) * u.radius;
        fish.position.y = Math.sin(t * 0.6 + u.phase) * u.yAmp;
        fish.rotation.y = -angle + Math.PI / 2;
        // tail wag
        const tail = fish.children[1];
        if (tail) tail.rotation.y = Math.sin(t * 6 + u.phase) * 0.4;
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
