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
    camera.position.set(0, 3.5, 18)

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
      uniforms: { uTime: { value: 0 }, uFlash: { value: 0 } },
      vertexShader: /* glsl */ `
        uniform float uTime;
        varying vec3 vWorld;
        varying vec3 vNormal;
        varying float vHeight;

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

          vec3 disp = vec3(0.0);
          // Irrational wavelength ratios (golden-ish) so the pattern does not tile.
          // Directions spread around wind, steepness sum ~0.75.
          disp += gerstner(xz, normalize(vec2(1.0, 0.15)), 0.11, 27.4, uTime, tangent, binormal);
          disp += gerstner(xz, normalize(vec2(0.62, 0.78)), 0.10, 16.9, uTime, tangent, binormal);
          disp += gerstner(xz, normalize(vec2(-0.18, 0.98)), 0.09, 10.5, uTime, tangent, binormal);
          disp += gerstner(xz, normalize(vec2(0.85, -0.42)), 0.08, 6.5, uTime, tangent, binormal);
          disp += gerstner(xz, normalize(vec2(-0.55, 0.48)), 0.07, 4.0, uTime, tangent, binormal);
          disp += gerstner(xz, normalize(vec2(0.22, -0.97)), 0.06, 2.47, uTime, tangent, binormal);
          disp += gerstner(xz, normalize(vec2(-0.9, -0.2)), 0.05, 1.53, uTime, tangent, binormal);
          disp += gerstner(xz, normalize(vec2(0.4, 0.55)), 0.04, 0.95, uTime, tangent, binormal);
          // low-amplitude noise so crests never line up into a grid
          float n = sin(xz.x * 0.37 + uTime * 0.6) * sin(xz.y * 0.29 - uTime * 0.45);
          disp.y += n * 0.08;

          // disp.y is up. Plane local Z is 0; after rotation local Y is horizontal,
          // so put vertical into local Z (which becomes world Y after -PI/2).
          vec3 p = position;
          p.x += disp.x;
          p.y += disp.z;
          p.z += disp.y;

          vHeight = disp.y;
          vec4 world = modelMatrix * vec4(p, 1.0);
          vWorld = world.xyz;

          // Normal in the same local frame, then to world
          vec3 nLocal = normalize(cross(binormal, tangent));
          // remap: local (x, up=z, y) 
          vec3 n = normalize(vec3(nLocal.x, nLocal.z, nLocal.y));
          vNormal = normalize(mat3(modelMatrix) * n);

          gl_Position = projectionMatrix * viewMatrix * world;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uFlash;
        varying vec3 vWorld;
        varying vec3 vNormal;
        varying float vHeight;

        void main() {
          vec3 N = normalize(vNormal);
          vec3 V = normalize(cameraPosition - vWorld);
          float fres = pow(1.0 - max(dot(N, V), 0.0), 4.0);

          vec3 deep = vec3(0.02, 0.05, 0.1);
          vec3 sky = vec3(0.32, 0.38, 0.46);
          vec3 col = mix(deep, sky, fres * 0.7);

          // foam only on crests
          float foam = smoothstep(0.4, 0.75, vHeight);
          col = mix(col, vec3(0.72, 0.78, 0.84), foam * 0.5);

          vec3 L = normalize(vec3(-0.35, 0.8, 0.25));
          float spec = pow(max(dot(reflect(-L, N), V), 0.0), 64.0);
          col += vec3(0.65, 0.75, 0.9) * spec * 0.45;

          col += vec3(0.45, 0.55, 0.7) * uFlash * 0.65;

          float dist = length(vWorld.xz);
          col *= mix(1.0, 0.25, smoothstep(10.0, 42.0, dist));

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
      camera.lookAt(0, 1.6, -30)
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
