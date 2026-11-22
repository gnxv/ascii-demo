'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

type FishData = {
  position: THREE.Vector3
  velocity: THREE.Vector3
  phase: number
  speed: number
  size: number
  hue: number
}

export default function ThreeFishSchool() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x03060a)

    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.1,
      50
    )
    camera.position.set(0, 0, 14)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    // Soft ambient for depth
    scene.add(new THREE.AmbientLight(0x112233, 0.4))

    // --- Neon fish shape (body + tail as one Shape) ---
    function createFishShape() {
      const shape = new THREE.Shape()
      // Body
      shape.moveTo(1.1, 0)
      shape.quadraticCurveTo(0.6, 0.45, 0, 0.38)
      shape.quadraticCurveTo(-0.7, 0.32, -1.05, 0.12)
      // Tail fork
      shape.lineTo(-1.55, 0.55)
      shape.lineTo(-1.25, 0)
      shape.lineTo(-1.55, -0.55)
      shape.lineTo(-1.05, -0.12)
      shape.quadraticCurveTo(-0.7, -0.32, 0, -0.38)
      shape.quadraticCurveTo(0.6, -0.45, 1.1, 0)
      return shape
    }

    const fishShape = createFishShape()
    const fishGeo = new THREE.ShapeGeometry(fishShape, 12)

    // --- Neon shader ---
    const neonMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        attribute float aPhase;
        attribute float aHue;
        attribute float aSize;

        varying vec2 vUv;
        varying float vHue;
        varying float vPhase;
        varying float vAlong;

        void main() {
          vec3 pos = position;
          float along = position.x;
          vAlong = along;
          vHue = aHue;
          vPhase = aPhase;

          // Tail wave
          float wave = sin(along * 4.5 + uTime * 6.5 + aPhase) * 0.22 * smoothstep(-0.3, 1.2, -along);
          pos.y += wave;

          // Slight body flex
          pos.y += sin(uTime * 2.2 + aPhase) * 0.04 * (1.0 - abs(along));

          vec4 mv = modelViewMatrix * instanceMatrix * vec4(pos * aSize, 1.0);
          gl_Position = projectionMatrix * mv;

          vUv = uv;
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vHue;
        varying float vPhase;
        varying float vAlong;

        vec3 hsl2rgb(float h, float s, float l) {
          float c = (1.0 - abs(2.0 * l - 1.0)) * s;
          float x = c * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0));
          float m = l - c * 0.5;
          vec3 rgb = (h < 1.0/6.0) ? vec3(c, x, 0.0) :
                     (h < 2.0/6.0) ? vec3(x, c, 0.0) :
                     (h < 3.0/6.0) ? vec3(0.0, c, x) :
                     (h < 4.0/6.0) ? vec3(0.0, x, c) :
                     (h < 5.0/6.0) ? vec3(x, 0.0, c) : vec3(c, 0.0, x);
          return rgb + m;
        }

        void main() {
          // Core bright color
          vec3 core = hsl2rgb(vHue, 0.95, 0.62);

          // Edge glow (distance from center line)
          float edge = abs(vAlong);
          float glow = smoothstep(0.9, 0.2, edge);

          // Pulsing
          float pulse = 0.75 + 0.25 * sin(uTime * 3.0 + vPhase);

          vec3 col = core * glow * pulse;

          // Stronger outline feel
          float outline = smoothstep(0.85, 1.05, abs(vAlong) * 0.7 + 0.3);
          col += core * outline * 0.6;

          gl_FragColor = vec4(col, glow * 0.95);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })

    // Fix: uTime needs to be accessible in fragment too
    neonMat.fragmentShader = neonMat.fragmentShader.replace(
      'varying float vAlong;',
      'varying float vAlong;\nuniform float uTime;'
    )

    const FISH_COUNT = 32
    const fishes: FishData[] = []

    for (let i = 0; i < FISH_COUNT; i++) {
      const a = Math.random() * Math.PI * 2
      const r = 1.2 + Math.random() * 5.5
      fishes.push({
        position: new THREE.Vector3(
          Math.cos(a) * r,
          (Math.random() - 0.5) * 4.5,
          Math.sin(a) * r * 0.6
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.08,
          (Math.random() - 0.5) * 0.3
        ),
        phase: Math.random() * Math.PI * 2,
        speed: 0.65 + Math.random() * 0.5,
        size: 0.55 + Math.random() * 0.45,
        hue: Math.random() * 0.25 + 0.48, // cyan → blue → purple range
      })
    }

    const phaseA = new Float32Array(FISH_COUNT)
    const hueA = new Float32Array(FISH_COUNT)
    const sizeA = new Float32Array(FISH_COUNT)
    fishes.forEach((f, i) => {
      phaseA[i] = f.phase
      hueA[i] = f.hue
      sizeA[i] = f.size
    })

    fishGeo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phaseA, 1))
    fishGeo.setAttribute('aHue', new THREE.InstancedBufferAttribute(hueA, 1))
    fishGeo.setAttribute('aSize', new THREE.InstancedBufferAttribute(sizeA, 1))

    const mesh = new THREE.InstancedMesh(fishGeo, neonMat, FISH_COUNT)
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    scene.add(mesh)

    const dummy = new THREE.Object3D()
    const mouse = new THREE.Vector2(999, 999)
    const mouseWorld = new THREE.Vector3()

    const onMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    }
    container.addEventListener('pointermove', onMove)
    container.addEventListener('pointerleave', () => mouse.set(999, 999))

    const ray = new THREE.Raycaster()
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)

    let time = 0
    let animId: number

    const maxSpd = 1.15
    const maxF = 0.028
    const neigh = 3.0
    const sepDist = 1.1

    const animate = () => {
      animId = requestAnimationFrame(animate)
      time += 0.016
      neonMat.uniforms.uTime.value = time

      if (mouse.x < 10) {
        ray.setFromCamera(mouse, camera)
        ray.ray.intersectPlane(plane, mouseWorld)
      }

      for (let i = 0; i < FISH_COUNT; i++) {
        const f = fishes[i]

        const sep = new THREE.Vector3()
        const ali = new THREE.Vector3()
        const coh = new THREE.Vector3()
        let count = 0

        for (let j = 0; j < FISH_COUNT; j++) {
          if (i === j) continue
          const o = fishes[j]
          const d = f.position.distanceTo(o.position)
          if (d < neigh && d > 0.01) {
            if (d < sepDist) {
              sep.add(f.position.clone().sub(o.position).normalize().divideScalar(d))
            }
            ali.add(o.velocity)
            coh.add(o.position)
            count++
          }
        }

        const acc = new THREE.Vector3()
        if (count > 0) {
          sep.normalize().multiplyScalar(maxSpd).sub(f.velocity).clampLength(0, maxF * 1.5)
          acc.add(sep)
          ali.divideScalar(count).normalize().multiplyScalar(maxSpd).sub(f.velocity).clampLength(0, maxF)
          acc.add(ali)
          coh.divideScalar(count).sub(f.position).normalize().multiplyScalar(maxSpd).sub(f.velocity).clampLength(0, maxF * 0.55)
          acc.add(coh)
        }

        if (mouse.x < 10) {
          const toM = f.position.clone().sub(mouseWorld)
          if (toM.length() < 4.8) {
            toM.normalize().multiplyScalar(maxSpd * 1.4).sub(f.velocity).clampLength(0, maxF * 2.2)
            acc.add(toM)
          }
        }

        acc.add(f.position.clone().multiplyScalar(-0.005))
        f.velocity.add(acc).clampLength(0.25, maxSpd * f.speed)
        f.position.add(f.velocity.clone().multiplyScalar(0.32))

        if (Math.abs(f.position.x) > 9) f.velocity.x *= -0.35
        if (Math.abs(f.position.y) > 5) f.velocity.y *= -0.35
        if (Math.abs(f.position.z) > 6) f.velocity.z *= -0.35

        const dir = f.velocity.clone().normalize()
        dummy.position.copy(f.position)
        dummy.lookAt(f.position.clone().add(dir))
        dummy.rotateY(Math.PI)
        dummy.scale.setScalar(1)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      }

      mesh.instanceMatrix.needsUpdate = true

      camera.position.x = Math.sin(time * 0.08) * 0.8
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      container.removeEventListener('pointermove', onMove)
      renderer.dispose()
      fishGeo.dispose()
      neonMat.dispose()
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        inset: 0,
        cursor: 'crosshair',
        background: '#03060a',
      }}
    />
  )
}
