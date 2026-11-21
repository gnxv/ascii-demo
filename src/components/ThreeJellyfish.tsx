"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type Pt = { x: number; y: number; z: number; px: number; py: number; pz: number };

export default function ThreeJellyfish() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020208);
    scene.fog = new THREE.FogExp2(0x020208, 0.03);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x332244, 0.6);
    scene.add(ambient);
    const light = new THREE.PointLight(0xcc88ff, 1.6, 40);
    light.position.set(2, 4, 6);
    scene.add(light);

    // --- soft bell (rings of points) ---
    const rings = 8;
    const ptsPerRing = 20;
    const bell: Pt[][] = [];
    for (let r = 0; r < rings; r++) {
      const ring: Pt[] = [];
      const rad = 0.6 + r * 0.28;
      const y = 2.2 - r * 0.35;
      for (let p = 0; p < ptsPerRing; p++) {
        const a = (p / ptsPerRing) * Math.PI * 2;
        ring.push({
          x: Math.cos(a) * rad,
          y,
          z: Math.sin(a) * rad,
          px: Math.cos(a) * rad,
          py: y,
          pz: Math.sin(a) * rad,
        });
      }
      bell.push(ring);
    }

    // tentacles as chains attached to bottom ring
    const tentacles: Pt[][] = [];
    for (let i = 0; i < 18; i++) {
      const chain: Pt[] = [];
      const attach = bell[rings - 1][i % ptsPerRing];
      for (let s = 0; s < 16; s++) {
        chain.push({
          x: attach.x,
          y: attach.y - s * 0.28,
          z: attach.z,
          px: attach.x,
          py: attach.y - s * 0.28,
          pz: attach.z,
        });
      }
      tentacles.push(chain);
    }

    // visual: lines for bell rings + tentacles
    const bellLines: THREE.Line[] = [];
    for (let r = 0; r < rings; r++) {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(ptsPerRing * 3);
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.LineBasicMaterial({ color: 0xdd99ff, transparent: true, opacity: 0.7 });
      const line = new THREE.LineLoop(geo, mat);
      bellLines.push(line);
      scene.add(line);
    }

    const tentLines: THREE.Line[] = [];
    tentacles.forEach(() => {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(16 * 3);
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.LineBasicMaterial({ color: 0xaa66ee, transparent: true, opacity: 0.55 });
      const line = new THREE.Line(geo, mat);
      tentLines.push(line);
      scene.add(line);
    });

    // dust
    const dustCount = 180;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 20;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xaaccff, size: 0.03, transparent: true, opacity: 0.3 }));
    scene.add(dust);

    let t = 0;
    let raf = 0;
    const mouse = { x: 0, y: 0 };

    const onMove = (e: MouseEvent) => {
      const r = mount.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / r.width - 0.5) * 8;
      mouse.y = -((e.clientY - r.top) / r.height - 0.5) * 6;
    };
    mount.addEventListener("mousemove", onMove);

    const animate = () => {
      t += 0.016;
      const pulse = 1 + Math.sin(t * 1.6) * 0.12;

      // integrate bell points (verlet-ish + spring to rest)
      bell.forEach((ring, ri) => {
        const restR = (0.6 + ri * 0.28) * pulse;
        const restY = 2.2 - ri * 0.35 + Math.sin(t * 0.4) * 0.15;
        ring.forEach((pt, pi) => {
          const ang = (pi / ptsPerRing) * Math.PI * 2 + t * 0.08;
          const tx = Math.cos(ang) * restR;
          const ty = restY;
          const tz = Math.sin(ang) * restR;
          // spring toward target
          const dx = tx - pt.x;
          const dy = ty - pt.y;
          const dz = tz - pt.z;
          pt.x += dx * 0.12;
          pt.y += dy * 0.12;
          pt.z += dz * 0.12;
          // mouse push
          const mdx = pt.x - mouse.x;
          const mdy = pt.y - mouse.y;
          const md = Math.sqrt(mdx * mdx + mdy * mdy) || 1;
          if (md < 3) {
            pt.x += (mdx / md) * 0.04;
            pt.y += (mdy / md) * 0.04;
          }
        });
      });

      // tentacles follow
      tentacles.forEach((chain, ti) => {
        const attach = bell[rings - 1][ti % ptsPerRing];
        let px = attach.x;
        let py = attach.y;
        let pz = attach.z;
        chain.forEach((seg, si) => {
          const wave = Math.sin(t * 1.4 + ti + si * 0.35) * 0.18;
          const tx = px + wave;
          const ty = py - 0.28;
          const tz = pz + Math.cos(t * 1.1 + ti) * 0.12;
          seg.x += (tx - seg.x) * 0.22;
          seg.y += (ty - seg.y) * 0.22;
          seg.z += (tz - seg.z) * 0.22;
          px = seg.x;
          py = seg.y;
          pz = seg.z;
        });
      });

      // update geometries
      bell.forEach((ring, ri) => {
        const pos = bellLines[ri].geometry.attributes.position.array as Float32Array;
        ring.forEach((pt, pi) => {
          pos[pi * 3] = pt.x;
          pos[pi * 3 + 1] = pt.y;
          pos[pi * 3 + 2] = pt.z;
        });
        bellLines[ri].geometry.attributes.position.needsUpdate = true;
      });

      tentacles.forEach((chain, ti) => {
        const pos = tentLines[ti].geometry.attributes.position.array as Float32Array;
        chain.forEach((seg, si) => {
          pos[si * 3] = seg.x;
          pos[si * 3 + 1] = seg.y;
          pos[si * 3 + 2] = seg.z;
        });
        tentLines[ti].geometry.attributes.position.needsUpdate = true;
      });

      dust.rotation.y = t * 0.01;
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
