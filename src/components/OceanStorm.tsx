'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function OceanStorm() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a1018)
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

    scene.add(new THREE.AmbientLight(0x334455, 0.5))
    const moon = new THREE.DirectionalLight(0x99aacc, 0.7)
    moon.position.set(-6, 14, 6)
    scene.add(moon)

    const flash = new THREE.PointLight(0xddeeff, 0, 50)
    flash.position.set(0, 12, -4)
    scene.add(flash)

    // Plane in XY, rotated to XZ. Waves must sample position.xy (local), not .xz.
    const oceanGeo = new THREE.PlaneGeometry(90, 90, 200, 200)
    const oceanMat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: { uTime: { value: 0 }, uFlash: { value: 0 }, uWind: { value: 0 } },
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

          vec3 deep = vec3(0.05, 0.1, 0.18);
          vec3 sky = vec3(0.42, 0.5, 0.6);
          vec3 col = mix(deep, sky, fres * 0.75);

          // Subsurface on thin crests
          float sss = pow(max(vHeight, 0.0), 1.4) * 0.35;
          col += vec3(0.05, 0.18, 0.2) * sss;

          // Foam where the surface compresses, plus a little on tall crests
          float foam = smoothstep(0.85, 0.4, vJacobian);
          foam = max(foam, smoothstep(0.35, 0.7, vHeight) * 0.6);

          vec3 L = normalize(vec3(-0.3, 0.65, 0.2));
          vec3 R = reflect(-L, N);
          float ndv = max(dot(N, V), 0.0);
          // Two lobes: a soft sheen and a tighter glint, both stronger at grazing angles
          float sheen = pow(max(dot(R, V), 0.0), 12.0);
          float glint = pow(max(dot(R, V), 0.0), 90.0);
          float spec = (sheen * 0.25 + glint * 0.7) * mix(0.4, 1.0, 1.0 - ndv);
          col += vec3(0.75, 0.82, 0.95) * spec;

          col += vec3(0.45, 0.55, 0.7) * uFlash * 0.65;

          float dist = length(vWorld.xz);
          col *= mix(1.0, 0.4, smoothstep(10.0, 40.0, dist));

          // Foam after the fade so it stays visible
          col = mix(col, vec3(0.82, 0.86, 0.9), foam * 0.75);

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    })
    const ocean = new THREE.Mesh(oceanGeo, oceanMat)
    ocean.rotation.x = -Math.PI / 2
    scene.add(ocean)

    // Rain
    const N = 700
    const rainPos = new Float32Array(N * 3)
    const rain: { x: number; y: number; z: number; v: number }[] = []
    for (let i = 0; i < N; i++) {
      rain.push({
        x: (Math.random() - 0.5) * 36,
        y: Math.random() * 16,
        z: (Math.random() - 0.5) * 36,
        v: 9 + Math.random() * 5,
      })
      rainPos[i * 3] = rain[i].x
      rainPos[i * 3 + 1] = rain[i].y
      rainPos[i * 3 + 2] = rain[i].z
    }
    const rainGeo = new THREE.BufferGeometry()
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3))
    const rainMat = new THREE.PointsMaterial({
      color: 0xbbccdd,
      size: 0.05,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    })
    const rainPoints = new THREE.Points(rainGeo, rainMat)
    scene.add(rainPoints)

    const bolts: THREE.Line[] = []
    function spawnBolt() {
      const pts: THREE.Vector3[] = []
      let x = (Math.random() - 0.5) * 18
      let y = 14
      let z = -6 - Math.random() * 12
      pts.push(new THREE.Vector3(x, y, z))
      for (let i = 0; i < 12; i++) {
        x += (Math.random() - 0.5) * 1.6
        y -= 0.8 + Math.random() * 0.4
        z += (Math.random() - 0.5) * 0.7
        pts.push(new THREE.Vector3(x, y, z))
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts)
      const mat = new THREE.LineBasicMaterial({
        color: 0xeef5ff,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      })
      const line = new THREE.Line(geo, mat)
      scene.add(line)
      bolts.push(line)
      setTimeout(() => {
        scene.remove(line)
        geo.dispose()
        mat.dispose()
        const idx = bolts.indexOf(line)
        if (idx >= 0) bolts.splice(idx, 1)
      }, 160)
    }

    let time = 0
    let nextFlash = 2 + Math.random() * 4
    let animId: number

    const animate = () => {
      animId = requestAnimationFrame(animate)
      time += 0.016

      oceanMat.uniforms.uTime.value = time
      oceanMat.uniforms.uWind.value = time * 0.03

      if (time > nextFlash) {
        spawnBolt()
        if (Math.random() > 0.45) setTimeout(spawnBolt, 70)
        flash.intensity = 7 + Math.random() * 5
        oceanMat.uniforms.uFlash.value = 1
        nextFlash = time + 2.8 + Math.random() * 5
      }
      flash.intensity *= 0.8
      oceanMat.uniforms.uFlash.value *= 0.84

      for (let i = 0; i < N; i++) {
        rain[i].y -= rain[i].v * 0.016
        rain[i].x += 0.5 * 0.016
        if (rain[i].y < 0) {
          rain[i].y = 14 + Math.random() * 4
          rain[i].x = (Math.random() - 0.5) * 36
          rain[i].z = (Math.random() - 0.5) * 36
        }
        rainPos[i * 3] = rain[i].x
        rainPos[i * 3 + 1] = rain[i].y
        rainPos[i * 3 + 2] = rain[i].z
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
      rainGeo.dispose()
      rainMat.dispose()
      bolts.forEach((b) => {
        b.geometry.dispose()
        ;(b.material as THREE.Material).dispose()
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
