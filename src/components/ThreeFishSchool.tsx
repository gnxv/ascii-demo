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
    scene.background = new THREE.Color(0x020408)

    const camera = new THREE.PerspectiveCamera(
      38,
      container.clientWidth / container.clientHeight,
      0.1,
      40
    )
    camera.position.set(0, 0, 16)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0x0a1520, 0.3))

    function createFishShape() {
      const s = new THREE.Shape()
      s.moveTo(1.35, 0)
      s.quadraticCurveTo(0.85, 0.52, 0.2, 0.48)
      s.quadraticCurveTo(-0.45, 0.42, -0.85, 0.22)
      s.lineTo(-1.45, 0.68)
      s.lineTo(-1.05, 0.08)
      s.lineTo(-1.45, -0.68)
      s.lineTo(-0.85, -0.22)
      s.quadraticCurveTo(-0.45, -0.42, 0.2, -0.48)
      s.quadraticCurveTo(0.85, -0.52, 1.35, 0)
      return s
    }

    const fishGeo = new THREE.ShapeGeometry(createFishShape(), 16)
    const eyeGeo = new THREE.CircleGeometry(0.09, 10)

    const neonMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: /* glsl */ `
        uniform float uTime;
        attribute float aPhase;
        attribute float aHue;
        attribute float aSize;

        varying float vHue;
        varying float vPhase;
        varying float vAlong;
        varying float vSide;

        void main() {
          vec3 pos = position;
          float along = position.x;
          vAlong = along;
          vSide = position.y;
          vHue = aHue;
          vPhase = aPhase;

          float tailFactor = smoothstep(0.2, -1.2, along);
          float wave = sin(along * 3.8 + uTime * 4.2 + aPhase) * 0.28 * tailFactor;
          pos.y += wave;
          pos.y += sin(uTime * 1.6 + aPhase) * 0.03;

          vec4 mv = modelViewMatrix * instanceMatrix * vec4(pos * aSize, 1.0);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        varying float vHue;
        varying float vPhase;
        varying float vAlong;
        varying float vSide;

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
          vec3 core = hsl2rgb(vHue, 1.0, 0.65);
          float body = smoothstep(0.55, 0.15, abs(vSide));
          body *= smoothstep(1.4, 0.3, abs(vAlong));
          float outline = 0.0;
          outline += smoothstep(0.42, 0.5, abs(vSide)) * 0.8;
          outline += smoothstep(1.15, 1.35, abs(vAlong)) * 0.6;
          float tail = smoothstep(-0.6, -1.3, vAlong);
          float pulse = 0.82 + 0.18 * sin(uTime * 2.4 + vPhase);
          vec3 col = core * (body * 0.55 + outline * 1.1 + tail * 0.3) * pulse;
          float alpha = clamp(body * 0.7 + outline * 0.95 + tail * 0.4, 0.0, 1.0);
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })

    const eyeMat = new THREE.MeshBasicMaterial({
      color: 0x001122,
      transparent: true,
      opacity: 0.85,
    })

    const FISH_COUNT = 42
    const fishes: FishData[] = []

    for (let i = 0; i < FISH_COUNT; i++) {
      // Spread across the whole "aquarium"
      fishes.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 16,
          (Math.random() - 0.5) * 8.5,
          (Math.random() - 0.5) * 6
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.18,
          (Math.random() - 0.5) * 0.06,
          (Math.random() - 0.5) * 0.12
        ),
        phase: Math.random() * Math.PI * 2,
        speed: 0.35 + Math.random() * 0.4,
        size: 0.42 + Math.random() * 0.22, // ~half previous size
        hue: 0.48 + Math.random() * 0.22,
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

    const bodyMesh = new THREE.InstancedMesh(fishGeo, neonMat, FISH_COUNT)
    bodyMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    scene.add(bodyMesh)

    const eyeMesh = new THREE.InstancedMesh(eyeGeo, eyeMat, FISH_COUNT)
    eyeMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    scene.add(eyeMesh)

    const dummy = new THREE.Object3D()
    const eyeDummy = new THREE.Object3D()
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

    // Aquarium style: weak schooling, each fish mostly does its own thing.
    // Strong separation so they don't pile up, mild alignment, very weak cohesion.
    const maxSpd = 0.42
    const maxF = 0.008
    const neighborDist = 2.6
    const separationDist = 1.1

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
          if (d < neighborDist && d > 0.01) {
            if (d < separationDist) {
              // Stronger push when closer (1/d weighting)
              const diff = f.position.clone().sub(o.position).normalize().divideScalar(Math.max(d, 0.15))
              sep.add(diff)
            }
            ali.add(o.velocity)
            coh.add(o.position)
            count++
          }
        }

        const acc = new THREE.Vector3()
        if (count > 0) {
          // Separation — strongest
          if (sep.lengthSq() > 0) {
            sep.normalize().multiplyScalar(maxSpd).sub(f.velocity)
            sep.clampLength(0, maxF * 2.2)
            acc.add(sep)
          }
          // Alignment — weak (aquarium fish don't perfectly sync)
          ali.divideScalar(count).normalize().multiplyScalar(maxSpd).sub(f.velocity)
          ali.clampLength(0, maxF * 0.45)
          acc.add(ali)
          // Cohesion — very weak
          coh.divideScalar(count).sub(f.position).normalize().multiplyScalar(maxSpd).sub(f.velocity)
          coh.clampLength(0, maxF * 0.18)
          acc.add(coh)
        }

        // Soft mouse avoidance
        if (mouse.x < 10) {
          const toM = f.position.clone().sub(mouseWorld)
          const md = toM.length()
          if (md < 4.2) {
            toM.normalize().multiplyScalar(maxSpd * 1.15).sub(f.velocity)
            toM.clampLength(0, maxF * 1.8)
            acc.add(toM)
          }
        }

        // Very gentle centering — just keep them in the tank
        acc.add(f.position.clone().multiplyScalar(-0.0012))

        // Mild random wander so each fish has its own "business"
        acc.x += (Math.random() - 0.5) * 0.004
        acc.y += (Math.random() - 0.5) * 0.002
        acc.z += (Math.random() - 0.5) * 0.003

        f.velocity.add(acc)
        f.velocity.clampLength(0.18, maxSpd * f.speed)
        f.position.add(f.velocity.clone().multiplyScalar(0.26))

        // Soft aquarium bounds (whole screen)
        if (Math.abs(f.position.x) > 9.2) f.velocity.x *= -0.35
        if (Math.abs(f.position.y) > 4.6) f.velocity.y *= -0.35
        if (Math.abs(f.position.z) > 5.5) f.velocity.z *= -0.35

        const dir = f.velocity.clone().normalize()
        dummy.position.copy(f.position)
        dummy.lookAt(f.position.clone().add(dir))
        dummy.rotateY(Math.PI)
        dummy.updateMatrix()
        bodyMesh.setMatrixAt(i, dummy.matrix)

        const eyeOffset = dir.clone().multiplyScalar(0.72 * f.size)
        eyeDummy.position.copy(f.position).add(eyeOffset)
        eyeDummy.lookAt(f.position.clone().add(dir))
        eyeDummy.rotateY(Math.PI)
        eyeDummy.scale.setScalar(f.size * 0.9)
        eyeDummy.updateMatrix()
        eyeMesh.setMatrixAt(i, eyeDummy.matrix)
      }

      bodyMesh.instanceMatrix.needsUpdate = true
      eyeMesh.instanceMatrix.needsUpdate = true

      camera.position.x = Math.sin(time * 0.05) * 0.5
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
      eyeGeo.dispose()
      neonMat.dispose()
      eyeMat.dispose()
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
        background: '#020408',
      }}
    />
  )
}
