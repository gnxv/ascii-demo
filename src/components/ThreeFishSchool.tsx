"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function createFishBodyGeometry() {
  const points: THREE.Vector2[] = [];
  // profile: nose → body → peduncle (x = radius, y = height along body)
  const profile = [
    [0.02, -1.6],
    [0.18, -1.3],
    [0.42, -0.9],
    [0.55, -0.4],
    [0.62, 0.0],
    [0.58, 0.4],
    [0.48, 0.75],
    [0.32, 1.05],
    [0.18, 1.3],
    [0.08, 1.5],
    [0.02, 1.65],
  ];
  profile.forEach(([r, y]) => points.push(new THREE.Vector2(r, y)));
  const geo = new THREE.LatheGeometry(points, 20);
  geo.rotateX(Math.PI / 2);
  geo.scale(1, 1, 1.1);
  geo.computeVertexNormals();
  return geo;
}

const bodyGeo = createFishBodyGeometry();
const tailGeo = new THREE.ConeGeometry(0.28, 0.55, 8);
tailGeo.rotateZ(Math.PI / 2);
tailGeo.translate(0.35, 0, 0);

const dorsalGeo = new THREE.PlaneGeometry(0.35, 0.22);
dorsalGeo.rotateX(Math.PI / 2);
dorsalGeo.translate(-0.05, 0.35, 0);

const pectoralGeo = new THREE.PlaneGeometry(0.22, 0.14);
pectoralGeo.rotateY(Math.PI / 2);

function Fish({ seed, color }: { seed: number; color: string }) {
  const group = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Mesh>(null);
  const phase = useMemo(() => seed * 10, [seed]);
  const speed = useMemo(() => 0.35 + (seed % 0.4), [seed]);
  const radius = useMemo(() => 4 + (seed % 3.5), [seed]);
  const yOffset = useMemo(() => ((seed * 13) % 2.4) - 1.2, [seed]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!group.current) return;

    const angle = t * speed * 0.55 + phase;
    const wobble = Math.sin(t * 0.7 + phase) * 0.4;
    group.current.position.x = Math.cos(angle) * radius + Math.sin(t * 0.3 + phase) * 0.6;
    group.current.position.z = Math.sin(angle) * radius * 0.85 + Math.cos(t * 0.25 + phase) * 0.5;
    group.current.position.y = yOffset + Math.sin(t * 0.45 + phase) * 0.35;

    const dx = -Math.sin(angle) * radius * speed * 0.55;
    const dz = Math.cos(angle) * radius * 0.85 * speed * 0.55;
    group.current.rotation.y = Math.atan2(dx, dz) + Math.PI;
    group.current.rotation.z = Math.sin(t * 1.8 + phase) * 0.08;

    if (tail.current) {
      tail.current.rotation.y = Math.sin(t * 4.2 + phase) * 0.45;
    }
  });

  return (
    <group ref={group}>
      <mesh geometry={bodyGeo} castShadow receiveShadow>
        <meshStandardMaterial
          color={color}
          roughness={0.35}
          metalness={0.15}
          envMapIntensity={0.6}
        />
      </mesh>
      <mesh ref={tail} geometry={tailGeo} position={[0.85, 0, 0]}>
        <meshStandardMaterial color={color} roughness={0.45} metalness={0.1} />
      </mesh>
      <mesh geometry={dorsalGeo} position={[0, 0.15, 0]}>
        <meshStandardMaterial color={color} roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={pectoralGeo} position={[0.15, -0.05, 0.22]} rotation={[0, 0, -0.4]}>
        <meshStandardMaterial color={color} roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={pectoralGeo} position={[0.15, -0.05, -0.22]} rotation={[0, 0, 0.4]}>
        <meshStandardMaterial color={color} roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
      {/* simple eye */}
      <mesh position={[0.15, 0.12, 0.38]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color="#111" roughness={0.2} />
      </mesh>
    </group>
  );
}

function School() {
  const fishes = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        seed: Math.random() * 100 + i,
        color: i % 5 === 0 ? "#c8d8e8" : i % 4 === 0 ? "#7a9bb8" : "#4a6a88",
      })),
    []
  );

  return (
    <>
      {fishes.map((f, i) => (
        <Fish key={i} seed={f.seed} color={f.color} />
      ))}
    </>
  );
}

function Scene() {
  const { camera } = useThree();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    camera.position.x = Math.sin(t * 0.08) * 1.2;
    camera.position.y = 1.4 + Math.sin(t * 0.05) * 0.3;
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <fog attach="fog" args={["#061018", 8, 28]} />
      <color attach="background" args={["#061018"]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[4, 8, 2]}
        intensity={1.1}
        color="#a0c8e0"
        castShadow
      />
      <directionalLight position={[-6, 2, -4]} intensity={0.25} color="#406080" />
      <School />
    </>
  );
}

export default function ThreeFishSchool() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 1.6, 12], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.5]}
        shadows
      >
        <Scene />
      </Canvas>
    </div>
  );
}
