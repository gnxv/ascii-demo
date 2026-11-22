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
  target: THREE.Vector3
  targetTimer: number
  prevDir: THREE.Vector3
  personality: number      // 0 = straight, 1 = more wandering
  preferredY: number
  cruiseTimer: number
  maneuvering: boolean
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
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 8.5,
        (Math.random() - 0.5) * 6
      )
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.18,
        (Math.random() - 0.5) * 0.06,
        (Math.random() - 0.5) * 0.12
      )
      fishes.push({
        position: pos,
        velocity: vel,
        phase: Math.random() * Math.PI * 2,
        speed: 0.35 + Math.random() * 0.4,
        size: 0.42 + Math.random() * 0.22,
        hue: 0.48 + Math.random() * 0.22,
        target: new THREE.Vector3(
          (Math.random() - 0.5) * 14,
          (Math.random() - 0.5) * 7,
          (Math.random() - 0.5) * 5
        ),
        targetTimer: 2 + Math.random() * 4,
        prevDir: vel.clone().normalize(),
        personality: Math.random(),
        preferredY: (Math.random() - 0.5) * 3.5,
        cruiseTimer: 1 + Math.random() * 3,
        maneuvering: false,
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

    // Full natural aquarium physics
    const maxSpd = 0.42
    const maxF = 0.007
    const neighborDist = 2.6
    const separationDist = 1.3
    const damping = 0.982
    const maxTurn = 0.045 // radians per frame approx via velocity blend

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

        // Smarter target selection
        f.targetTimer -= 0.016
        f.cruiseTimer -= 0.016

        if (f.cruiseTimer <= 0) {
          f.maneuvering = Math.random() < 0.35
          f.cruiseTimer = f.maneuvering ? 0.8 + Math.random() * 1.2 : 2.5 + Math.random() * 4
        }

        if (f.targetTimer <= 0 || f.position.distanceTo(f.target) < 1.4) {
          const dir = f.prevDir.clone()
          // Prefer continuing roughly forward
          const forwardBias = dir.multiplyScalar(4 + Math.random() * 3)
          let newTarget = f.position.clone().add(forwardBias)

          // Sometimes pick a zone or another fish
          if (Math.random() < 0.3) {
            // Zone preference
            const zones = [
              new THREE.Vector3(-6, f.preferredY, 0),
              new THREE.Vector3(6, f.preferredY, 0),
              new THREE.Vector3(0, f.preferredY + 1.5, 1),
              new THREE.Vector3(0, f.preferredY - 1.5, -1),
            ]
            newTarget = zones[Math.floor(Math.random() * zones.length)].clone()
            newTarget.x += (Math.random() - 0.5) * 3
            newTarget.y += (Math.random() - 0.5) * 1.5
          } else if (Math.random() < 0.15) {
            // Interest in another fish at a distance
            const other = fishes[Math.floor(Math.random() * FISH_COUNT)]
            if (other !== f) {
              newTarget = other.position.clone().add(
                new THREE.Vector3((Math.random() - 0.5) * 2.5, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.5)
              )
            }
          }

          // Clamp to aquarium
          newTarget.x = Math.max(-8, Math.min(8, newTarget.x))
          newTarget.y = Math.max(-3.5, Math.min(3.5, newTarget.y))
          newTarget.z = Math.max(-4, Math.min(4, newTarget.z))

          f.target.copy(newTarget)
          f.targetTimer = 2.5 + Math.random() * 4 + f.personality * 2
        }

        const sep = new THREE.Vector3()
        const ali = new THREE.Vector3()
        const sidePush = new THREE.Vector3()
        let count = 0

        for (let j = 0; j < FISH_COUNT; j++) {
          if (i === j) continue
          const o = fishes[j]
          const d = f.position.distanceTo(o.position)
          if (d < neighborDist && d > 0.01) {
            if (d < separationDist) {
              const diff = f.position.clone().sub(o.position).normalize().divideScalar(Math.max(d, 0.25))
              sep.add(diff)
              // Side push when close laterally
              const toOther = o.position.clone().sub(f.position)
              const lateral = toOther.clone().cross(f.prevDir).cross(f.prevDir)
              if (lateral.lengthSq() > 0.01) {
                sidePush.add(lateral.normalize().multiplyScalar(-0.4 / Math.max(d, 0.3)))
              }
            }
            // Soft alignment only when comfortably spaced
            if (d > separationDist * 0.7) {
              ali.add(o.velocity)
            }
            count++
          }
        }

        const acc = new THREE.Vector3()

        if (sep.lengthSq() > 0) {
          sep.normalize().multiplyScalar(maxSpd).sub(f.velocity)
          sep.clampLength(0, maxF * 2.6)
          acc.add(sep)
        }
        if (sidePush.lengthSq() > 0) {
          sidePush.clampLength(0, maxF * 0.8)
          acc.add(sidePush)
        }
        if (count > 0 && ali.lengthSq() > 0) {
          ali.divideScalar(Math.max(count, 1)).normalize().multiplyScalar(maxSpd).sub(f.velocity)
          ali.clampLength(0, maxF * 0.2)
          acc.add(ali)
        }

        // Seek target (weaker when cruising straight)
        const toTarget = f.target.clone().sub(f.position)
        if (toTarget.length() > 0.6) {
          const seekStrength = f.maneuvering ? 1.1 : 0.55
          toTarget.normalize().multiplyScalar(maxSpd * seekStrength).sub(f.velocity)
          toTarget.clampLength(0, maxF * (f.maneuvering ? 1.1 : 0.6))
          acc.add(toTarget)
        }

        // Layered mouse: close flee, medium diverge, rare interest
        if (mouse.x < 10) {
          const toM = f.position.clone().sub(mouseWorld)
          const md = toM.length()
          if (md < 7 && md > 0.2) {
            if (md < 3.2) {
              // Strong avoid
              const avoid = toM.normalize().multiplyScalar(maxSpd * 1.5).sub(f.velocity)
              avoid.clampLength(0, maxF * 1.8)
              acc.add(avoid)
            } else if (md < 5.5) {
              // Gentle diverge
              const diverge = toM.normalize().multiplyScalar(maxSpd * 0.4).sub(f.velocity)
              diverge.clampLength(0, maxF * 0.5)
              acc.add(diverge)
            } else if (Math.random() < 0.002 && f.personality > 0.6) {
              // Rare curiosity
              const interest = mouseWorld.clone().sub(f.position).normalize().multiplyScalar(maxSpd * 0.3)
              interest.clampLength(0, maxF * 0.3)
              acc.add(interest)
            }
          }
        }

        // Soft wall repulsion
        const wallForce = new THREE.Vector3()
        if (Math.abs(f.position.x) > 7.2) wallForce.x = -Math.sign(f.position.x) * 0.014
        if (Math.abs(f.position.y) > 3.6) wallForce.y = -Math.sign(f.position.y) * 0.011
        if (Math.abs(f.position.z) > 4.2) wallForce.z = -Math.sign(f.position.z) * 0.009
        acc.add(wallForce)

        // Preferred height pull
        const yDiff = f.preferredY - f.position.y
        acc.y += yDiff * 0.0015

        // Gentle centering
        acc.add(f.position.clone().multiplyScalar(-0.0005))

        // Personality-based wander (stronger for high personality)
        const wanderAmp = 0.0015 + f.personality * 0.002
        acc.add(new THREE.Vector3(
          Math.sin(time * 0.6 + f.phase) * wanderAmp,
          Math.sin(time * 0.4 + f.phase * 1.1) * wanderAmp * 0.6,
          Math.cos(time * 0.5 + f.phase * 0.8) * wanderAmp * 0.7
        ))

        // Apply + damping
        f.velocity.add(acc)
        f.velocity.multiplyScalar(damping)

        // Limit turn rate
        const desiredDir = f.velocity.clone().normalize()
        const turnLerp = f.maneuvering ? 0.18 : 0.08
        const blended = f.prevDir.clone().lerp(desiredDir, turnLerp).normalize()
        const spd = f.velocity.length()
        f.velocity.copy(blended).multiplyScalar(spd)
        f.prevDir.copy(blended)

        // Situational speed
        let targetSpeed = maxSpd * (0.75 + f.speed * 0.4)
        if (f.maneuvering) targetSpeed *= 1.15
        if (mouse.x < 10 && f.position.distanceTo(mouseWorld) < 3.5) targetSpeed *= 1.2
        if (!f.maneuvering && count === 0) targetSpeed *= 0.85
        f.velocity.clampLength(0.08, targetSpeed)

        f.position.add(f.velocity.clone().multiplyScalar(0.18))

        // Hard safety bounds
        if (Math.abs(f.position.x) > 9.8) f.velocity.x *= -0.4
        if (Math.abs(f.position.y) > 5.0) f.velocity.y *= -0.4
        if (Math.abs(f.position.z) > 5.8) f.velocity.z *= -0.4

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
