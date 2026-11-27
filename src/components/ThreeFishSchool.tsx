'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

type FishType = 'leader' | 'schooler' | 'lazy'

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
  personality: number
  preferredY: number
  cruiseTimer: number
  maneuvering: boolean
  targetCooldown: number
  mouseSensitivity: number
  speedPhase: number
  type: FishType
  fearTimer: number
  turnRate: number
  visualDir: THREE.Vector3
  bank: number
  visualQuat: THREE.Quaternion
}

export default function ThreeFishSchool() {
  const mountRef = useRef<HTMLDivElement>(null)
  const visible = useRef(true)

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

    scene.add(new THREE.AmbientLight(0x0a1520, 0.35))
    const dirLight = new THREE.DirectionalLight(0x88ccff, 0.4)
    dirLight.position.set(2, 4, 6)
    scene.add(dirLight)

    // Body: large tetrahedron, tip forward
    const bodyGeo = new THREE.TetrahedronGeometry(0.9, 0)
    bodyGeo.rotateZ(Math.PI / 2)
    bodyGeo.rotateY(Math.PI)
    bodyGeo.scale(1.55, 0.8, 0.7)

    // Tail: smaller tetrahedron attached at the rear
    const tailGeo = new THREE.TetrahedronGeometry(0.42, 0)
    tailGeo.rotateZ(-Math.PI / 2)
    tailGeo.scale(1.1, 0.75, 0.6)
    tailGeo.translate(-1.15, 0, 0)

    const neonMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: /* glsl */ `
        uniform float uTime;
        attribute float aPhase;
        attribute float aHue;
        attribute float aSize;
        attribute float aTurn;

        varying float vHue;
        varying float vPhase;
        varying float vAlong;
        varying float vSide;
        varying vec3 vNormal;

        void main() {
          vec3 pos = position;
          float along = position.x;
          vAlong = along;
          vSide = position.y;
          vHue = aHue;
          vPhase = aPhase;
          vNormal = normal;

          float tailFactor = smoothstep(0.4, -1.2, along);
          float amp = 0.1 + aTurn * 0.22;
          float wave = sin(along * 3.5 + uTime * 4.8 + aPhase) * amp * tailFactor;
          pos.y += wave;
          pos.z += wave * 0.35;

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
        varying vec3 vNormal;

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
          vec3 core = hsl2rgb(vHue, 1.0, 0.68);
          float body = smoothstep(1.1, 0.2, abs(vAlong));
          float outline = 0.0;
          outline += smoothstep(0.7, 0.95, abs(vSide)) * 0.7;
          outline += smoothstep(1.0, 1.3, abs(vAlong)) * 0.5;
          float tail = smoothstep(0.2, -1.1, vAlong);
          float pulse = 0.8 + 0.2 * sin(uTime * 2.2 + vPhase);
          float shade = 0.65 + 0.35 * abs(vNormal.y);
          vec3 col = core * (body * 0.6 + outline * 1.0 + tail * 0.25) * pulse * shade;
          float alpha = clamp(body * 0.85 + outline * 0.9 + tail * 0.35, 0.0, 1.0);
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })

    const FISH_COUNT = 28
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
      const r = Math.random()
      const type: FishType = r < 0.18 ? 'leader' : r < 0.72 ? 'schooler' : 'lazy'
      const startDir = vel.clone().normalize()
      fishes.push({
        position: pos,
        velocity: vel,
        phase: Math.random() * Math.PI * 2,
        speed: type === 'lazy' ? 0.28 + Math.random() * 0.2 : 0.38 + Math.random() * 0.35,
        size: 0.42 + Math.random() * 0.22,
        hue: 0.48 + Math.random() * 0.22,
        target: new THREE.Vector3(
          (Math.random() - 0.5) * 14,
          (Math.random() - 0.5) * 7,
          (Math.random() - 0.5) * 5
        ),
        targetTimer: 2 + Math.random() * 4,
        prevDir: startDir.clone(),
        personality: Math.random(),
        preferredY: (Math.random() - 0.5) * 3.5,
        cruiseTimer: 1 + Math.random() * 3,
        maneuvering: false,
        targetCooldown: 0,
        mouseSensitivity: type === 'lazy' ? 0.3 + Math.random() * 0.4 : 0.5 + Math.random() * 0.7,
        speedPhase: Math.random() * Math.PI * 2,
        type,
        fearTimer: 0,
        turnRate: 0,
        visualDir: startDir.clone(),
        bank: 0,
        visualQuat: (() => {
          const q = new THREE.Quaternion()
          const tmp = new THREE.Object3D()
          tmp.lookAt(startDir)
          tmp.rotateY(Math.PI)
          tmp.updateMatrix()
          q.setFromRotationMatrix(tmp.matrix)
          return q
        })(),
      })
    }

    const phaseA = new Float32Array(FISH_COUNT)
    const hueA = new Float32Array(FISH_COUNT)
    const sizeA = new Float32Array(FISH_COUNT)
    const turnA = new Float32Array(FISH_COUNT)
    fishes.forEach((f, i) => {
      phaseA[i] = f.phase
      hueA[i] = f.hue
      sizeA[i] = f.size
      turnA[i] = 0
    })

    bodyGeo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phaseA, 1))
    bodyGeo.setAttribute('aHue', new THREE.InstancedBufferAttribute(hueA, 1))
    bodyGeo.setAttribute('aSize', new THREE.InstancedBufferAttribute(sizeA, 1))
    bodyGeo.setAttribute('aTurn', new THREE.InstancedBufferAttribute(turnA, 1))

    tailGeo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phaseA, 1))
    tailGeo.setAttribute('aHue', new THREE.InstancedBufferAttribute(hueA, 1))
    tailGeo.setAttribute('aSize', new THREE.InstancedBufferAttribute(sizeA, 1))
    tailGeo.setAttribute('aTurn', new THREE.InstancedBufferAttribute(turnA, 1))

    const bodyMesh = new THREE.InstancedMesh(bodyGeo, neonMat, FISH_COUNT)
    bodyMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    scene.add(bodyMesh)

    const tailMesh = new THREE.InstancedMesh(tailGeo, neonMat, FISH_COUNT)
    tailMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    scene.add(tailMesh)

    const dummy = new THREE.Object3D()
    const mouse = new THREE.Vector2(999, 999)
    const mouseWorld = new THREE.Vector3()
    const worldUp = new THREE.Vector3(0, 1, 0)

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

    const maxSpd = 0.44
    const maxF = 0.0075
    const neighborDist = 3.0
    const separationDist = 1.25
    const damping = 0.995

    const io = new IntersectionObserver(
      ([e]) => { visible.current = e.isIntersecting },
      { threshold: 0.02 }
    )
    io.observe(container)
    const animate = () => {
      animId = requestAnimationFrame(animate)
      if (!visible.current) return
      time += 0.016
      neonMat.uniforms.uTime.value = time

      if (mouse.x < 10) {
        ray.setFromCamera(mouse, camera)
        ray.ray.intersectPlane(plane, mouseWorld)
      }

      for (let i = 0; i < FISH_COUNT; i++) {
        const f = fishes[i]

        f.targetTimer -= 0.016
        f.cruiseTimer -= 0.016
        f.targetCooldown = Math.max(0, f.targetCooldown - 0.016)
        f.fearTimer = Math.max(0, f.fearTimer - 0.016)

        if (f.cruiseTimer <= 0) {
          f.maneuvering = Math.random() < (f.type === 'leader' ? 0.25 : 0.16)
          f.cruiseTimer = f.maneuvering ? 0.7 + Math.random() * 1.0 : 3.5 + Math.random() * 5.5
        }

        const canChangeTarget = f.targetCooldown <= 0 && (f.targetTimer <= 0 || f.position.distanceTo(f.target) < 1.5)
        if (canChangeTarget) {
          const dir = f.prevDir.clone()
          const dist = f.type === 'leader' ? 7 + Math.random() * 5 : 5.5 + Math.random() * 4
          let newTarget = f.position.clone().add(dir.multiplyScalar(dist))

          if (f.type !== 'leader' && Math.random() < 0.28) {
            const zones = [
              new THREE.Vector3(-7, f.preferredY, 0),
              new THREE.Vector3(7, f.preferredY, 0),
              new THREE.Vector3(0, f.preferredY + 1.2, 1),
              new THREE.Vector3(0, f.preferredY - 1.2, -1),
            ]
            newTarget = zones[Math.floor(Math.random() * zones.length)].clone()
            newTarget.x += (Math.random() - 0.5) * 2.5
          } else if (f.type === 'schooler' && Math.random() < 0.2) {
            const other = fishes[Math.floor(Math.random() * FISH_COUNT)]
            if (other !== f) {
              const followDir = other.prevDir.clone().multiplyScalar(2.4)
              newTarget = other.position.clone().add(followDir)
            }
          }

          const toNew = newTarget.clone().sub(f.position).normalize()
          if (f.prevDir.dot(toNew) < 0.2) {
            newTarget = f.position.clone().add(f.prevDir.clone().multiplyScalar(5.5 + Math.random() * 2.5))
          }

          newTarget.x = Math.max(-8.5, Math.min(8.5, newTarget.x))
          newTarget.y = Math.max(-3.8, Math.min(3.8, newTarget.y))
          newTarget.z = Math.max(-4.2, Math.min(4.2, newTarget.z))

          f.target.copy(newTarget)
          f.targetTimer = 3.8 + Math.random() * 5 + (1 - f.personality) * 2
          f.targetCooldown = 1.8 + Math.random() * 1.5
        }

        const sep = new THREE.Vector3()
        const ali = new THREE.Vector3()
        const coh = new THREE.Vector3()
        const sidePush = new THREE.Vector3()
        let count = 0

        for (let j = 0; j < FISH_COUNT; j++) {
          if (i === j) continue
          const o = fishes[j]
          const d = f.position.distanceTo(o.position)
          if (d < neighborDist && d > 0.01) {
            if (d < separationDist) {
              const diff = f.position.clone().sub(o.position).normalize().divideScalar(Math.max(d, 0.22))
              sep.add(diff)
              const toOther = o.position.clone().sub(f.position)
              const lateral = toOther.clone().cross(f.prevDir).cross(f.prevDir)
              if (lateral.lengthSq() > 0.01) {
                sidePush.add(lateral.normalize().multiplyScalar(-0.3 / Math.max(d, 0.28)))
              }
            }
            if (d > separationDist * 0.65) {
              ali.add(o.velocity)
              coh.add(o.position)
            }
            count++
          }
        }

        const acc = new THREE.Vector3()

        if (sep.lengthSq() > 0) {
          sep.normalize().multiplyScalar(maxSpd).sub(f.velocity)
          sep.clampLength(0, maxF * 2.2)
          acc.add(sep)
        }
        if (sidePush.lengthSq() > 0) {
          sidePush.clampLength(0, maxF * 0.6)
          acc.add(sidePush)
        }

        const alignStrength = f.type === 'schooler' ? 0.5 : f.type === 'leader' ? 0.12 : 0.28
        const cohStrength = f.type === 'schooler' ? 0.35 : 0.15
        if (count > 0 && ali.lengthSq() > 0) {
          ali.divideScalar(Math.max(count, 1)).normalize().multiplyScalar(maxSpd).sub(f.velocity)
          ali.clampLength(0, maxF * alignStrength)
          acc.add(ali)
        }
        if (count > 1 && coh.lengthSq() > 0) {
          coh.divideScalar(count).sub(f.position)
          if (coh.length() > 0.3) {
            coh.normalize().multiplyScalar(maxSpd * 0.55).sub(f.velocity)
            coh.clampLength(0, maxF * cohStrength)
            acc.add(coh)
          }
        }

        const toTarget = f.target.clone().sub(f.position)
        if (toTarget.length() > 0.5) {
          const seekStrength = f.maneuvering ? 0.95 : (f.type === 'leader' ? 0.65 : 0.48)
          toTarget.normalize().multiplyScalar(maxSpd * seekStrength).sub(f.velocity)
          toTarget.clampLength(0, maxF * (f.maneuvering ? 0.9 : 0.5))
          acc.add(toTarget)
        }

        let mouseFlee = 0
        if (mouse.x < 10) {
          const toM = f.position.clone().sub(mouseWorld)
          const md = toM.length()
          const sens = f.mouseSensitivity
          if (md < 8.5 && md > 0.12) {
            const strength = Math.pow(Math.max(0, 1 - md / 8.5), 1.6) * sens
            if (strength > 0.04) {
              const avoid = toM.normalize().multiplyScalar(maxSpd * strength * 1.5).sub(f.velocity)
              avoid.clampLength(0, maxF * 1.8 * strength)
              acc.add(avoid)
              mouseFlee = strength
              if (strength > 0.25) f.fearTimer = Math.max(f.fearTimer, 1.0 + strength * 1.2)
            }
          }
        }
        if (f.fearTimer > 0) {
          acc.add(f.prevDir.clone().multiplyScalar(0.001 * f.fearTimer))
        }

        // Soft walls only
        const wallForce = new THREE.Vector3()
        const softX = Math.max(0, Math.abs(f.position.x) - 6.0)
        const softY = Math.max(0, Math.abs(f.position.y) - 2.6)
        const softZ = Math.max(0, Math.abs(f.position.z) - 3.2)
        if (softX > 0) wallForce.x = -Math.sign(f.position.x) * softX * 0.014
        if (softY > 0) wallForce.y = -Math.sign(f.position.y) * softY * 0.012
        if (softZ > 0) wallForce.z = -Math.sign(f.position.z) * softZ * 0.01
        acc.add(wallForce)

        const yDiff = f.preferredY - f.position.y
        const yStrength = f.type === 'lazy' ? 0.0065 : 0.0038
        acc.y += yDiff * yStrength

        acc.add(f.position.clone().multiplyScalar(-0.00035))

        const wanderAmp = (f.type === 'lazy' ? 0.0009 : 0.0014) + f.personality * 0.0015
        acc.add(new THREE.Vector3(
          Math.sin(time * 0.5 + f.phase) * wanderAmp,
          Math.sin(time * 0.35 + f.phase * 1.1) * wanderAmp * 0.5,
          Math.cos(time * 0.45 + f.phase * 0.8) * wanderAmp * 0.6
        ))

        f.velocity.add(acc)
        f.velocity.multiplyScalar(damping)

        // Physics direction (can change faster)
        const desiredDir = f.velocity.clone().normalize()
        const turnAngle = Math.acos(Math.max(-1, Math.min(1, f.prevDir.dot(desiredDir))))
        f.turnRate = THREE.MathUtils.lerp(f.turnRate, Math.min(1, turnAngle * 3.8), 0.1)
        turnA[i] = f.turnRate

        const turnLerp = f.maneuvering ? 0.08 : (f.type === 'lazy' ? 0.02 : 0.035)
        const blended = f.prevDir.clone().lerp(desiredDir, turnLerp).normalize()
        const spd = f.velocity.length()
        f.velocity.copy(blended).multiplyScalar(spd)
        f.prevDir.copy(blended)

        let targetSpeed = maxSpd * (0.58 + f.speed * 0.36)
        if (f.type === 'lazy') targetSpeed *= 0.82
        if (f.maneuvering) targetSpeed *= 1.18
        if (mouseFlee > 0.08) targetSpeed *= 1.04 + mouseFlee * 0.35
        if (f.fearTimer > 0.3) targetSpeed *= 1.06
        if (!f.maneuvering && count === 0 && f.type !== 'leader') targetSpeed *= 0.82
        targetSpeed *= 1.0 - f.turnRate * 0.25
        targetSpeed *= 1.0 + Math.sin(time * 0.8 + f.speedPhase) * 0.045
        f.velocity.clampLength(0.04, Math.max(0.07, targetSpeed))

        f.position.add(f.velocity.clone().multiplyScalar(0.18))

        // Gentle position clamp only (no velocity reverse)
        f.position.x = THREE.MathUtils.clamp(f.position.x, -10.8, 10.8)
        f.position.y = THREE.MathUtils.clamp(f.position.y, -5.8, 5.8)
        f.position.z = THREE.MathUtils.clamp(f.position.z, -6.6, 6.6)

        // ---- Visual orientation: smoothed direction + slerp, no lookAt flips ----
        const physDir = f.velocity.clone().normalize()
        f.visualDir.lerp(physDir, 0.07).normalize()

        // Bank
        const turnCrossY = f.visualDir.clone().cross(physDir).y
        const targetBank = (Math.sign(turnCrossY) || 0) * f.turnRate * 0.32
        f.bank = THREE.MathUtils.lerp(f.bank, targetBank, 0.05)

        // Build target quaternion stably
        const targetDummy = new THREE.Object3D()
        targetDummy.position.copy(f.position)
        const lookPoint = f.position.clone().add(f.visualDir)
        targetDummy.lookAt(lookPoint)
        targetDummy.rotateY(Math.PI)
        targetDummy.rotateX(f.bank)
        targetDummy.updateMatrix()

        if (!f.visualQuat) f.visualQuat = new THREE.Quaternion()
        const targetQuat = new THREE.Quaternion().setFromRotationMatrix(targetDummy.matrix)
        f.visualQuat.slerp(targetQuat, 0.12)

        dummy.position.copy(f.position)
        dummy.quaternion.copy(f.visualQuat)
        dummy.scale.set(1, 1, 1)
        dummy.updateMatrix()

        bodyMesh.setMatrixAt(i, dummy.matrix)
        tailMesh.setMatrixAt(i, dummy.matrix)
      }

      bodyGeo.attributes.aTurn.needsUpdate = true
      tailGeo.attributes.aTurn.needsUpdate = true
      bodyMesh.instanceMatrix.needsUpdate = true
      tailMesh.instanceMatrix.needsUpdate = true

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
      io.disconnect()
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      container.removeEventListener('pointermove', onMove)
      renderer.dispose()
      bodyGeo.dispose()
      tailGeo.dispose()
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
        background: '#020408',
      }}
    />
  )
}
