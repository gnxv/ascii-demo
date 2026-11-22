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
  stripe: number
}

export default function ThreeFishSchool() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x071018)
    scene.fog = new THREE.FogExp2(0x071018, 0.038)

    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.1,
      60
    )
    camera.position.set(0, 1.6, 12)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0x6a8aaa, 0.55))
    const key = new THREE.DirectionalLight(0xd0e8ff, 1.15)
    key.position.set(6, 9, 4)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0x406080, 0.3)
    fill.position.set(-4, 1, -5)
    scene.add(fill)

    // --- Strong fish silhouette geometry ---
    function makeBody() {
      const pts: THREE.Vector2[] = []
      const n = 28
      for (let i = 0; i <= n; i++) {
        const t = i / n
        const x = (t - 0.46) * 2.6
        // Classic fish profile: pointed snout, deep body, thin peduncle
        let r = Math.pow(Math.sin(t * Math.PI), 0.85) * 0.48
        r *= 1.15 - Math.pow(Math.max(t - 0.55, 0), 1.4) * 0.9
        if (t < 0.18) r *= 0.55 + t * 2.5
        pts.push(new THREE.Vector2(Math.max(r, 0.02), x))
      }
      const geo = new THREE.LatheGeometry(pts, 14)
      geo.rotateZ(Math.PI / 2)
      geo.translate(0.05, 0, 0)
      geo.computeVertexNormals()
      return geo
    }

    const bodyGeo = makeBody()

    // Tail — clear forked shape
    const tailShape = new THREE.Shape()
    tailShape.moveTo(0, 0)
    tailShape.lineTo(-1.05, 0.72)
    tailShape.lineTo(-0.72, 0.18)
    tailShape.lineTo(-0.85, 0)
    tailShape.lineTo(-0.72, -0.18)
    tailShape.lineTo(-1.05, -0.72)
    tailShape.lineTo(0, 0)
    const tailGeo = new THREE.ShapeGeometry(tailShape)
    tailGeo.translate(-1.25, 0, 0)

    // Dorsal fin
    const dorsalShape = new THREE.Shape()
    dorsalShape.moveTo(-0.1, 0)
    dorsalShape.lineTo(0.65, 0.48)
    dorsalShape.lineTo(0.35, 0.12)
    dorsalShape.lineTo(0.05, 0)
    const dorsalGeo = new THREE.ShapeGeometry(dorsalShape)
    dorsalGeo.rotateX(Math.PI / 2)
    dorsalGeo.translate(-0.05, 0.32, 0)

    // Pectoral fins (simple)
    const pecShape = new THREE.Shape()
    pecShape.moveTo(0, 0)
    pecShape.lineTo(0.42, 0.28)
    pecShape.lineTo(0.55, 0.05)
    pecShape.lineTo(0.2, -0.08)
    const pecGeo = new THREE.ShapeGeometry(pecShape)

    // --- Bold procedural shader ---
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: /* glsl */ `
        uniform float uTime;
        attribute float aPhase;
        attribute float aHue;
        attribute float aStripe;
        attribute float aSize;

        varying vec3 vN;
        varying vec3 vView;
        varying float vAlong;
        varying float vHue;
        varying float vStripe;
        varying float vPhase;
        varying vec3 vPos;

        void main() {
          vec3 pos = position;
          float along = position.x;
          vAlong = along;
          vPos = position;
          vHue = aHue;
          vStripe = aStripe;
          vPhase = aPhase;

          float wave = sin(along * 6.2 + uTime * 8.0 + aPhase) * 0.18 * smoothstep(-0.6, 1.1, along);
          pos.z += wave;

          float bank = sin(uTime * 1.4 + aPhase) * 0.12;
          pos.y += bank * along * 0.28;

          vec4 mv = modelViewMatrix * instanceMatrix * vec4(pos * aSize, 1.0);
          gl_Position = projectionMatrix * mv;

          vN = normalize(normalMatrix * mat3(instanceMatrix) * normal);
          vView = -mv.xyz;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vN;
        varying vec3 vView;
        varying float vAlong;
        varying float vHue;
        varying float vStripe;
        varying float vPhase;
        varying vec3 vPos;

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
          vec3 n = normalize(vN);
          float along = vAlong;

          // Strong countershading
          float counter = smoothstep(-0.7, 0.45, n.y);
          float L = mix(0.22, 0.68, counter);
          vec3 base = hsl2rgb(vHue, 0.62, L);

          // Bold vertical stripes (highly readable)
          float stripePos = along * 7.5 + vPhase * 0.4;
          float stripe = smoothstep(0.35, 0.5, abs(sin(stripePos)));
          stripe *= 0.75 + 0.25 * sin(vPos.y * 8.0);
          vec3 stripeCol = hsl2rgb(fract(vHue + 0.08), 0.75, 0.28);
          base = mix(base, stripeCol, stripe * vStripe);

          // Belly highlight
          float belly = smoothstep(0.1, -0.4, n.y);
          base = mix(base, hsl2rgb(vHue, 0.3, 0.82), belly * 0.45);

          // Eye — very clear
          vec2 eyeCenter = vec2(0.08, 0.28);
          float eyeDist = length(vPos.yz - eyeCenter);
          float eye = smoothstep(0.11, 0.07, eyeDist);
          base = mix(base, vec3(0.04, 0.04, 0.06), eye);

          // Pupil
          float pupil = smoothstep(0.055, 0.03, eyeDist);
          base = mix(base, vec3(0.0), pupil);

          // Highlight
          float hl = smoothstep(0.028, 0.012, length(vPos.yz - (eyeCenter + vec2(0.02, 0.025))));
          base = mix(base, vec3(1.0), hl * eye);

          // Lighting
          vec3 light = normalize(vec3(0.45, 0.9, 0.25));
          float diff = max(dot(n, light), 0.0);
          float rim = pow(1.0 - max(dot(n, normalize(vView)), 0.0), 2.2) * 0.3;

          vec3 col = base * (0.35 + diff * 0.8) + rim * vec3(0.7, 0.85, 1.0);

          gl_FragColor = vec4(col, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    })

    const FISH_COUNT = 36
    const fishes: FishData[] = []

    for (let i = 0; i < FISH_COUNT; i++) {
      const a = Math.random() * Math.PI * 2
      const r = 1.5 + Math.random() * 5.2
      fishes.push({
        position: new THREE.Vector3(Math.cos(a) * r, (Math.random() - 0.5) * 3.5, Math.sin(a) * r),
        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.45, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.45),
        phase: Math.random() * Math.PI * 2,
        speed: 0.7 + Math.random() * 0.5,
        size: 0.7 + Math.random() * 0.4,
        hue: Math.random() * 0.15 + 0.52, // blue-cyan range mostly
        stripe: 0.6 + Math.random() * 0.4,
      })
    }

    const phaseA = new Float32Array(FISH_COUNT)
    const hueA = new Float32Array(FISH_COUNT)
    const stripeA = new Float32Array(FISH_COUNT)
    const sizeA = new Float32Array(FISH_COUNT)
    fishes.forEach((f, i) => {
      phaseA[i] = f.phase
      hueA[i] = f.hue
      stripeA[i] = f.stripe
      sizeA[i] = f.size
    })

    bodyGeo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phaseA, 1))
    bodyGeo.setAttribute('aHue', new THREE.InstancedBufferAttribute(hueA, 1))
    bodyGeo.setAttribute('aStripe', new THREE.InstancedBufferAttribute(stripeA, 1))
    bodyGeo.setAttribute('aSize', new THREE.InstancedBufferAttribute(sizeA, 1))

    const bodyMesh = new THREE.InstancedMesh(bodyGeo, mat, FISH_COUNT)
    bodyMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    scene.add(bodyMesh)

    const tailMat = new THREE.MeshStandardMaterial({
      color: 0x3a6a9a,
      roughness: 0.5,
      side: THREE.DoubleSide,
    })
    const tailMesh = new THREE.InstancedMesh(tailGeo, tailMat, FISH_COUNT)
    scene.add(tailMesh)

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

    let t = 0
    let id: number

    const maxSpd = 1.3
    const maxF = 0.03
    const neigh = 3.3
    const sep = 1.2

    const loop = () => {
      id = requestAnimationFrame(loop)
      t += 0.016
      mat.uniforms.uTime.value = t

      if (mouse.x < 10) {
        ray.setFromCamera(mouse, camera)
        ray.ray.intersectPlane(plane, mouseWorld)
      }

      for (let i = 0; i < FISH_COUNT; i++) {
        const f = fishes[i]
        const sepV = new THREE.Vector3()
        const ali = new THREE.Vector3()
        const coh = new THREE.Vector3()
        let c = 0

        for (let j = 0; j < FISH_COUNT; j++) {
          if (i === j) continue
          const o = fishes[j]
          const d = f.position.distanceTo(o.position)
          if (d < neigh && d > 0.01) {
            if (d < sep) {
              const diff = f.position.clone().sub(o.position).normalize().divideScalar(d)
              sepV.add(diff)
            }
            ali.add(o.velocity)
            coh.add(o.position)
            c++
          }
        }

        const acc = new THREE.Vector3()
        if (c > 0) {
          sepV.normalize().multiplyScalar(maxSpd).sub(f.velocity).clampLength(0, maxF * 1.6)
          acc.add(sepV)
          ali.divideScalar(c).normalize().multiplyScalar(maxSpd).sub(f.velocity).clampLength(0, maxF)
          acc.add(ali)
          coh.divideScalar(c).sub(f.position).normalize().multiplyScalar(maxSpd).sub(f.velocity).clampLength(0, maxF * 0.6)
          acc.add(coh)
        }

        if (mouse.x < 10) {
          const toM = f.position.clone().sub(mouseWorld)
          if (toM.length() < 5) {
            toM.normalize().multiplyScalar(maxSpd * 1.6).sub(f.velocity).clampLength(0, maxF * 2.5)
            acc.add(toM)
          }
        }

        acc.add(f.position.clone().multiplyScalar(-0.006))
        f.velocity.add(acc).clampLength(0.3, maxSpd * f.speed)
        f.position.add(f.velocity.clone().multiplyScalar(0.35))

        if (Math.abs(f.position.x) > 8) f.velocity.x *= -0.4
        if (Math.abs(f.position.y) > 4) f.velocity.y *= -0.4
        if (Math.abs(f.position.z) > 8) f.velocity.z *= -0.4

        const dir = f.velocity.clone().normalize()
        dummy.position.copy(f.position)
        dummy.lookAt(f.position.clone().add(dir))
        dummy.rotateY(Math.PI)
        dummy.updateMatrix()
        bodyMesh.setMatrixAt(i, dummy.matrix)

        dummy.position.add(dir.clone().multiplyScalar(-1.15 * f.size))
        dummy.updateMatrix()
        tailMesh.setMatrixAt(i, dummy.matrix)
      }

      bodyMesh.instanceMatrix.needsUpdate = true
      tailMesh.instanceMatrix.needsUpdate = true

      camera.position.x = Math.sin(t * 0.1) * 1.4
      camera.position.y = 1.4 + Math.sin(t * 0.06) * 0.3
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
    }
    loop()

    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('resize', onResize)
      container.removeEventListener('pointermove', onMove)
      renderer.dispose()
      bodyGeo.dispose()
      tailGeo.dispose()
      mat.dispose()
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, cursor: 'crosshair' }} />
}
