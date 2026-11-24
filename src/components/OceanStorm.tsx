'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function OceanStorm() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x070b14)
    scene.fog = new THREE.FogExp2(0x070b14, 0.018)

    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      80
    )
    camera.position.set(0, 3.2, 14)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0x223344, 0.4))
    const moon = new THREE.DirectionalLight(0x8899bb, 0.6)
    moon.position.set(-8, 12, 4)
    scene.add(moon)

    // Lightning flash light
    const flash = new THREE.PointLight(0xddeeff, 0, 40)
    flash.position.set(0, 10, -6)
    scene.add(flash)

    // Ocean — proper Gerstner with deep-water dispersion
    const oceanGeo = new THREE.PlaneGeometry(80, 80, 220, 220)
    const oceanMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uFlash: { value: 0 } },
      vertexShader: /* glsl */ `
        uniform float uTime;
        varying vec3 vWorld;
        varying vec3 vNormal;
        varying float vCrest;

        // dir, steepness, wavelength
        vec3 gerstner(vec3 p, vec2 dir, float steep, float lambda, float t, inout vec3 tangent, inout vec3 binormal) {
          float k = 6.2831853 / lambda;
          float c = sqrt(9.8 / k);                 // deep-water phase speed
          float f = k * (dot(dir, p.xz) - c * t);
          float a = steep / k;
          float s = sin(f);
          float co = cos(f);
          // horizontal + vertical displacement
          vec3 disp = vec3(dir.x * a * co, a * s, dir.y * a * co);
          // analytic derivatives for normals
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
          return disp;
        }

        void main() {
          vec3 p = position;
          vec3 tangent = vec3(1.0, 0.0, 0.0);
          vec3 binormal = vec3(0.0, 0.0, 1.0);

          // 6 waves: long swell -> short chop, directions around wind
          p += gerstner(position, normalize(vec2(1.0, 0.25)), 0.28, 28.0, uTime, tangent, binormal);
          p += gerstner(position, normalize(vec2(0.6, 0.8)), 0.22, 16.0, uTime, tangent, binormal);
          p += gerstner(position, normalize(vec2(-0.3, 1.0)), 0.18, 9.0, uTime, tangent, binormal);
          p += gerstner(position, normalize(vec2(0.9, -0.4)), 0.14, 5.5, uTime, tangent, binormal);
          p += gerstner(position, normalize(vec2(-0.7, 0.5)), 0.1, 3.2, uTime, tangent, binormal);
          p += gerstner(position, normalize(vec2(0.2, -1.0)), 0.07, 1.8, uTime, tangent, binormal);

          vCrest = p.y;
          vec4 world = modelMatrix * vec4(p, 1.0);
          vWorld = world.xyz;
          vNormal = normalize(mat3(modelMatrix) * cross(binormal, tangent));
          gl_Position = projectionMatrix * viewMatrix * world;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uFlash;
        varying vec3 vWorld;
        varying vec3 vNormal;
        varying float vCrest;

        void main() {
          vec3 N = normalize(vNormal);
          vec3 V = normalize(cameraPosition - vWorld);
          float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);

          vec3 deep = vec3(0.015, 0.04, 0.09);
          vec3 mid = vec3(0.04, 0.1, 0.16);
          vec3 sky = vec3(0.25, 0.3, 0.38);

          float h = smoothstep(-0.6, 0.8, vCrest);
          vec3 col = mix(deep, mid, h);
          col = mix(col, sky, fres * 0.55);

          // foam on sharp crests
          float foam = smoothstep(0.45, 0.85, vCrest) * smoothstep(0.2, 0.7, 1.0 - N.y);
          col = mix(col, vec3(0.7, 0.75, 0.8), foam * 0.7);

          // specular from moon-ish light
          vec3 L = normalize(vec3(-0.4, 0.7, 0.3));
          float spec = pow(max(dot(reflect(-L, N), V), 0.0), 48.0);
          col += vec3(0.6, 0.7, 0.85) * spec * 0.5;

          col += vec3(0.4, 0.5, 0.65) * uFlash * 0.7;

          float fade = smoothstep(40.0, 14.0, length(vWorld.xz));
          col *= 0.3 + fade * 0.7;

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    })
    const ocean = new THREE.Mesh(oceanGeo, oceanMat)
    ocean.rotation.x = -Math.PI / 2
    scene.add(ocean)

    // Rain
    const N = 800
    const rainPos = new Float32Array(N * 3)
    const rain: { x: number; y: number; z: number; v: number }[] = []
    for (let i = 0; i < N; i++) {
      rain.push({
        x: (Math.random() - 0.5) * 40,
        y: Math.random() * 18,
        z: (Math.random() - 0.5) * 40,
        v: 8 + Math.random() * 6,
      })
      rainPos[i * 3] = rain[i].x
      rainPos[i * 3 + 1] = rain[i].y
      rainPos[i * 3 + 2] = rain[i].z
    }
    const rainGeo = new THREE.BufferGeometry()
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3))
    const rainMat = new THREE.PointsMaterial({
      color: 0xaabbcc,
      size: 0.06,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    })
    const rainPoints = new THREE.Points(rainGeo, rainMat)
    scene.add(rainPoints)

    // Lightning bolts (simple additive lines, spawned on flash)
    const bolts: THREE.Line[] = []

    function spawnBolt() {
      const pts: THREE.Vector3[] = []
      let x = (Math.random() - 0.5) * 16
      let y = 12
      let z = -8 - Math.random() * 10
      pts.push(new THREE.Vector3(x, y, z))
      for (let i = 0; i < 14; i++) {
        x += (Math.random() - 0.5) * 1.4
        y -= 0.7 + Math.random() * 0.5
        z += (Math.random() - 0.5) * 0.6
        pts.push(new THREE.Vector3(x, y, z))
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts)
      const mat = new THREE.LineBasicMaterial({
        color: 0xddeeff,
        transparent: true,
        opacity: 0.95,
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
      }, 180)
    }

    let time = 0
    let nextFlash = 2 + Math.random() * 4
    let animId: number

    const animate = () => {
      animId = requestAnimationFrame(animate)
      time += 0.016

      oceanMat.uniforms.uTime.value = time

      // Lightning timing
      if (time > nextFlash) {
        spawnBolt()
        if (Math.random() > 0.5) setTimeout(spawnBolt, 80)
        flash.intensity = 8 + Math.random() * 6
        oceanMat.uniforms.uFlash.value = 1
        nextFlash = time + 2.5 + Math.random() * 5
      }
      flash.intensity *= 0.82
      oceanMat.uniforms.uFlash.value *= 0.85

      // Rain
      for (let i = 0; i < N; i++) {
        rain[i].y -= rain[i].v * 0.016
        rain[i].x += 0.4 * 0.016
        if (rain[i].y < 0) {
          rain[i].y = 16 + Math.random() * 4
          rain[i].x = (Math.random() - 0.5) * 40
          rain[i].z = (Math.random() - 0.5) * 40
        }
        rainPos[i * 3] = rain[i].x
        rainPos[i * 3 + 1] = rain[i].y
        rainPos[i * 3 + 2] = rain[i].z
      }
      rainGeo.attributes.position.needsUpdate = true

      camera.position.x = Math.sin(time * 0.05) * 1.2
      camera.lookAt(0, 0.5, 0)
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
        background: '#070b14',
      }}
    />
  )
}
