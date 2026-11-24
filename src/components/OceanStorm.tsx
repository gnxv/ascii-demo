'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function OceanStorm() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x05070c)
    scene.fog = new THREE.FogExp2(0x0a1018, 0.012)

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      120
    )
    // Low, looking across the surface to the horizon
    camera.position.set(0, 2.2, 12)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0x0a1018, 0.2))

    const flash = new THREE.PointLight(0xddeeff, 0, 50)
    flash.position.set(0, 12, -4)
    scene.add(flash)

    // Plane in XY, rotated to XZ. Waves must sample position.xy (local), not .xz.
    const oceanGeo = new THREE.PlaneGeometry(90, 90, 200, 200)
    const oceanMat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uFlash: { value: 0 },
        uWind: { value: 0 },
        uFlashPos: { value: new THREE.Vector3(0, 12, -8) },
        uSplash: { value: Array.from({ length: 12 }, () => new THREE.Vector3(0, -1, 0)) },
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uWind;
        varying vec3 vWorld;
        varying vec3 vNormal;
        varying float vHeight;
        varying float vJacobian;
        varying vec2 vXZ;

        // Catlike Coding / GPU Gems Gerstner.
        // steepness sum stays under ~0.8 so crests do not fold.
        vec3 gerstner(vec2 xz, vec2 dir, float steep, float lambda, float t,
                      inout vec3 tangent, inout vec3 binormal) {
          float k = 6.2831853 / lambda;
          float c = sqrt(9.8 / k);                 // deep-water dispersion
          float f = k * (dot(dir, xz) - c * t);
          float a = steep / k;
          float s = sin(f);
          float co = cos(f);

          tangent += vec3(
            -dir.x * dir.x * steep * s,
            dir.x * steep * co,
            -dir.x * dir.y * steep * s
          );
          binormal += vec3(
            -dir.x * dir.y * steep * s,
            dir.y * steep * co,
            -dir.y * dir.y * steep * s
          );

          return vec3(dir.x * a * co, a * s, dir.y * a * co);
        }

        void main() {
          // Plane is XY. After -PI/2 around X, local (x,y) becomes world (x,z).
          vec2 xz = position.xy;
          vec3 tangent = vec3(1.0, 0.0, 0.0);
          vec3 binormal = vec3(0.0, 0.0, 1.0);

          // Wind slowly rotates the field. Spectrum is a geometric progression
          // so wavelengths do not lock. Steepness sum = 0.60 (safe, no folding).
          float wa = uWind;
          mat2 wr = mat2(cos(wa), -sin(wa), sin(wa), cos(wa));
          vec3 disp = vec3(0.0);
          disp += gerstner(xz, wr * normalize(vec2(1.0, 0.15)), 0.14, 26.0, uTime, tangent, binormal);
          disp += gerstner(xz, wr * normalize(vec2(0.55, 0.85)), 0.11, 16.0, uTime, tangent, binormal);
          disp += gerstner(xz, wr * normalize(vec2(-0.2, 1.0)), 0.09, 9.9, uTime, tangent, binormal);
          disp += gerstner(xz, wr * normalize(vec2(0.85, -0.4)), 0.08, 6.1, uTime, tangent, binormal);
          disp += gerstner(xz, wr * normalize(vec2(-0.6, 0.45)), 0.07, 3.8, uTime, tangent, binormal);
          disp += gerstner(xz, wr * normalize(vec2(0.25, -0.95)), 0.06, 2.35, uTime, tangent, binormal);
          disp += gerstner(xz, wr * normalize(vec2(-0.9, -0.25)), 0.05, 4.7, uTime, tangent, binormal);

          // disp.y is up. Plane local Z is 0; after rotation local Y is horizontal,
          // so put vertical into local Z (which becomes world Y after -PI/2).
          vec3 p = position;
          p.x += disp.x;
          p.y += disp.z;
          p.z += disp.y;

          vHeight = disp.y;
          vXZ = xz;
          // Jacobian: how much the surface is compressed (foam where it folds)
          vJacobian = tangent.x * binormal.z - tangent.z * binormal.x;
          vec4 world = modelMatrix * vec4(p, 1.0);
          vWorld = world.xyz;

          // tangent/binormal are dP/dx, dP/dz in (x, up, z).
          // Local plane: x stays x, horizontal y gets dz, up goes to local z.
          vec3 dPx = vec3(tangent.x, tangent.z, tangent.y);
          vec3 dPy = vec3(binormal.x, binormal.z, binormal.y);
          vec3 n = normalize(cross(dPx, dPy));
          vNormal = normalize(mat3(modelMatrix) * n);

          gl_Position = projectionMatrix * viewMatrix * world;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform float uFlash;
        uniform vec3 uSplash[12];
        varying vec3 vWorld;
        varying vec3 vNormal;
        varying float vHeight;
        varying float vJacobian;
        varying vec2 vXZ;

        void main() {
          vec3 N = normalize(vNormal);
          // Fine ripple in the normal only — does not move the mesh
          float rip = sin(vXZ.x * 3.1 + uTime * 1.4) * sin(vXZ.y * 2.7 - uTime * 1.1);
          N = normalize(N + vec3(rip, 0.0, rip * 0.6) * 0.12);

          vec3 V = normalize(cameraPosition - vWorld);
          float fres = pow(1.0 - max(dot(N, V), 0.0), 4.0);

          vec3 deep = vec3(0.03, 0.05, 0.09);
          vec3 col = deep;
          // Sky reflection only while lightning lights the scene
          col = mix(col, vec3(0.45, 0.52, 0.62), fres * uFlash * 0.8);

          // Foam only where the surface compresses (wave about to fold / break).
          // Jacobian < 1 means vertices are bunching — that is the breaking face,
          // not the top of the crest.
          float foam = smoothstep(0.9, 0.45, vJacobian);
          // Prefer the steep front of the wave, not the flat peak
          float steep = 1.0 - abs(N.y);
          foam *= smoothstep(0.05, 0.35, steep);

          // Specular and fill only from the strike
          vec3 L = normalize(vec3(0.05, 0.9, 0.1));
          float spec = pow(max(dot(reflect(-L, N), V), 0.0), 20.0);
          col += vec3(0.85, 0.9, 1.0) * spec * uFlash;
          col += vec3(0.4, 0.5, 0.65) * uFlash * 0.5;

          float dist = length(vWorld.xz);
          col *= mix(1.0, 0.4, smoothstep(10.0, 40.0, dist));

          // Foam after the fade so it stays visible
          col = mix(col, vec3(0.82, 0.86, 0.9), foam * 0.75);

          // Subtle ripples from the last drops that hit. Waves stay dominant.
          float ripples = 0.0;
          for (int i = 0; i < 12; i++) {
            vec3 s = uSplash[i];
            float age = s.z;
            if (age < 0.0) continue;
            float d = length(vXZ - s.xy);
            float r = age * 0.45;
            float ring = smoothstep(0.14, 0.0, abs(d - r)) * (1.0 - age) * (1.0 - age);
            ripples += ring;
          }
          col += vec3(0.4, 0.46, 0.52) * clamp(ripples, 0.0, 1.0) * 0.12;

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    })
    const ocean = new THREE.Mesh(oceanGeo, oceanMat)
    ocean.rotation.x = -Math.PI / 2
    scene.add(ocean)

    // Volumetric storm clouds. Almost invisible until a strike lights them.
    const cloudGeo = new THREE.BoxGeometry(80, 14, 80)
    const cloudMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      uniforms: {
        uTime: { value: 0 },
        uFlash: { value: 0 },
        uFlashPos: { value: new THREE.Vector3(0, 12, -8) },
      },
      vertexShader: /* glsl */ `
        varying vec3 vWorld;
        varying vec3 vLocal;
        void main() {
          vLocal = position;
          vec4 w = modelMatrix * vec4(position, 1.0);
          vWorld = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform float uFlash;
        uniform vec3 uFlashPos;
        varying vec3 vWorld;
        varying vec3 vLocal;

        float hash(vec3 p) {
          p = fract(p * 0.1031);
          p += dot(p, p.yzx + 33.33);
          return fract((p.x + p.y) * p.z);
        }
        float noise(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x),
                mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
            mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
                mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
            f.z);
        }
        float fbm(vec3 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p = p * 2.1 + 11.7;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec3 ro = cameraPosition;
          vec3 rd = normalize(vWorld - ro);
          // March through the cloud slab
          float density = 0.0;
          float lit = 0.0;
          vec3 p = ro;
          for (int i = 0; i < 24; i++) {
            p += rd * 1.6;
            if (p.y < 8.0 || p.y > 22.0) continue;
            vec3 sp = p * 0.07 + vec3(uTime * 0.012, 0.0, uTime * 0.008);
            float d = fbm(sp);
            d = smoothstep(0.48, 0.72, d);
            density += d * 0.08;
            float dist = length(p - uFlashPos);
            lit += d * exp(-dist * 0.12);
          }
          density = clamp(density, 0.0, 1.0);
          // Dark mass, revealed by the strike
          vec3 col = vec3(0.02, 0.03, 0.05) * density;
          col += vec3(0.55, 0.65, 0.8) * lit * uFlash * 0.55;
          float alpha = density * (0.15 + uFlash * 0.75);
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(col, alpha);
        }
      `,
    })
    const clouds = new THREE.Mesh(cloudGeo, cloudMat)
    clouds.position.y = 15
    scene.add(clouds)


    // Rain as streaks (each drop is a short line), denser near the camera
    const N = 2200
    const rainPos = new Float32Array(N * 2 * 3)
    const rain: { x: number; y: number; z: number; v: number; len: number }[] = []
    for (let i = 0; i < N; i++) {
      const near = Math.random() < 0.65
      rain.push({
        x: (Math.random() - 0.5) * (near ? 16 : 40),
        y: Math.random() * 16,
        z: (Math.random() - 0.5) * (near ? 16 : 40) - (near ? 2 : 8),
        v: near ? 14 + Math.random() * 5 : 11 + Math.random() * 4,
        len: near ? 0.28 + Math.random() * 0.12 : 0.16 + Math.random() * 0.08,
      })
    }
    const rainGeo = new THREE.BufferGeometry()
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3))
    const rainMat = new THREE.LineBasicMaterial({
      color: 0x9aabbc,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    })
    const rainLines = new THREE.LineSegments(rainGeo, rainMat)
    scene.add(rainLines)

    const bolts: THREE.Group[] = []

    function displace(a: THREE.Vector3, b: THREE.Vector3, depth: number, out: THREE.Vector3[]) {
      if (depth <= 0) {
        out.push(b.clone())
        return
      }
      const mid = a.clone().add(b).multiplyScalar(0.5)
      const dir = b.clone().sub(a)
      const len = dir.length()
      const jitter = new THREE.Vector3(Math.random() - 0.5, (Math.random() - 0.5) * 0.3, Math.random() - 0.5)
      mid.add(jitter.normalize().multiplyScalar(len * 0.25))
      displace(a, mid, depth - 1, out)
      displace(mid, b, depth - 1, out)
    }

    function boltLine(pts: THREE.Vector3[], color: number, opacity: number) {
      const geo = new THREE.BufferGeometry().setFromPoints(pts)
      const mat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      return new THREE.Line(geo, mat)
    }

    function spawnBolt() {
      const group = new THREE.Group()
      const start = new THREE.Vector3((Math.random() - 0.5) * 16, 15, -6 - Math.random() * 10)
      const end = new THREE.Vector3(start.x + (Math.random() - 0.5) * 4, 0.3, start.z + (Math.random() - 0.5) * 3)
      const main: THREE.Vector3[] = [start.clone()]
      displace(start, end, 5, main)
      group.add(boltLine(main, 0xffffff, 1))
      group.add(boltLine(main, 0x99ccff, 0.4))
      for (let i = 2; i < main.length - 2; i += 4) {
        if (Math.random() > 0.5) continue
        const from = main[i]
        const to = from.clone().add(new THREE.Vector3((Math.random() - 0.5) * 3, -1.2 - Math.random(), (Math.random() - 0.5) * 3))
        const branch: THREE.Vector3[] = [from.clone()]
        displace(from, to, 3, branch)
        group.add(boltLine(branch, 0xddeeff, 0.65))
      }
      scene.add(group)
      bolts.push(group)
      flash.position.set(end.x, 8, end.z)
      oceanMat.uniforms.uFlashPos.value.set(end.x, 10, end.z)
      flash.intensity = 12
      oceanMat.uniforms.uFlash.value = 1
      setTimeout(() => {
        scene.remove(group)
        group.traverse((obj) => {
          const line = obj as THREE.Line
          if (line.geometry) line.geometry.dispose()
          const mat = line.material as THREE.Material | undefined
          if (mat && !Array.isArray(mat)) mat.dispose()
        })
        const idx = bolts.indexOf(group)
        if (idx >= 0) bolts.splice(idx, 1)
      }, 150)
    }

    let splashCursor = 0
    let time = 0
    let nextFlash = 2 + Math.random() * 4
    let animId: number

    const animate = () => {
      animId = requestAnimationFrame(animate)
      time += 0.016

      oceanMat.uniforms.uTime.value = time
      cloudMat.uniforms.uTime.value = time
      cloudMat.uniforms.uFlash.value = oceanMat.uniforms.uFlash.value
      cloudMat.uniforms.uFlashPos.value.copy(oceanMat.uniforms.uFlashPos.value)
      const splashes = oceanMat.uniforms.uSplash.value as THREE.Vector3[]
      for (let i = 0; i < 12; i++) {
        if (splashes[i].z >= 0) {
          splashes[i].z += 0.016
          if (splashes[i].z > 1) splashes[i].z = -1
        }
      }
      oceanMat.uniforms.uWind.value = time * 0.03

      if (time > nextFlash) {
        spawnBolt()
        if (Math.random() > 0.45) setTimeout(spawnBolt, 70)
        nextFlash = time + 2.4 + Math.random() * 4
      }
      flash.intensity *= 0.8
      oceanMat.uniforms.uFlash.value *= 0.84

      const wind = 2.4
      rainMat.opacity = 0.1 + oceanMat.uniforms.uFlash.value * 0.18
      for (let i = 0; i < N; i++) {
        const d = rain[i]
        d.y -= d.v * 0.016
        d.x += wind * 0.016
        if (d.y < 0) {
          // Only near drops leave a ripple, and only some of them
          if (Math.abs(d.x) < 10 && Math.abs(d.z) < 10 && Math.random() < 0.08) {
            const slot = splashCursor % 12
            splashCursor++
            const arr = oceanMat.uniforms.uSplash.value as THREE.Vector3[]
            arr[slot].set(d.x, d.z, 0)
          }
          d.y = 14 + Math.random() * 4
          const near = Math.random() < 0.65
          d.x = (Math.random() - 0.5) * (near ? 16 : 40)
          d.z = (Math.random() - 0.5) * (near ? 16 : 40) - (near ? 2 : 8)
          d.len = near ? 0.28 : 0.16
        }
        // streak: head and a tail offset by wind and fall
        const o = i * 6
        rainPos[o] = d.x
        rainPos[o + 1] = d.y
        rainPos[o + 2] = d.z
        rainPos[o + 3] = d.x - wind * d.len * 0.08
        rainPos[o + 4] = d.y + d.len
        rainPos[o + 5] = d.z
      }
      rainGeo.attributes.position.needsUpdate = true

      camera.position.x = Math.sin(time * 0.04) * 1.4
      camera.lookAt(0, 0.8, -18)
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
      renderer.dispose()
      oceanGeo.dispose()
      oceanMat.dispose()
      cloudGeo.dispose()
      cloudMat.dispose()
      rainGeo.dispose()
      rainMat.dispose()
      bolts.forEach((g) => {
        g.traverse((obj) => {
          const line = obj as THREE.Line
          if (line.geometry) line.geometry.dispose()
          const mat = line.material as THREE.Material | undefined
          if (mat && !Array.isArray(mat)) mat.dispose()
        })
      })
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
        background: '#0a1018',
      }}
    />
  )
}
