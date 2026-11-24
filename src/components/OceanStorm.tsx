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

    // Ocean
    const oceanGeo = new THREE.PlaneGeometry(60, 60, 180, 180)
    const oceanMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uFlash: { value: 0 } },
      vertexShader: /* glsl */ `
        uniform float uTime;
        varying vec3 vPos;
        varying float vH;

        vec3 gerstner(vec2 p, float t) {
          // 4 waves
          vec2 d1 = normalize(vec2(1.0, 0.3));
          vec2 d2 = normalize(vec2(-0.4, 1.0));
          vec2 d3 = normalize(vec2(0.7, -0.6));
          vec2 d4 = normalize(vec2(-0.2, -1.0));
          float h = 0.0;
          vec2 disp = vec2(0.0);
          // amp, freq, speed, steep
          h += 0.55 * sin(dot(d1, p) * 0.35 + t * 0.8);
          disp += d1 * 0.25 * cos(dot(d1, p) * 0.35 + t * 0.8);
          h += 0.35 * sin(dot(d2, p) * 0.55 + t * 1.1);
          disp += d2 * 0.12 * cos(dot(d2, p) * 0.55 + t * 1.1);
          h += 0.18 * sin(dot(d3, p) * 0.9 + t * 1.4);
          h += 0.1 * sin(dot(d4, p) * 1.4 + t * 1.8);
          return vec3(disp.x, h, disp.y);
        }

        void main() {
          vec3 pos = position;
          vec3 g = gerstner(pos.xz, uTime);
          pos.x += g.x;
          pos.y += g.y;
          pos.z += g.z;
          vH = g.y;
          vPos = pos;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uFlash;
        varying float vH;
        varying vec3 vPos;
        void main() {
          vec3 deep = vec3(0.02, 0.06, 0.12);
          vec3 mid = vec3(0.05, 0.12, 0.2);
          vec3 foam = vec3(0.55, 0.62, 0.7);
          float crest = smoothstep(0.35, 0.7, vH);
          vec3 col = mix(deep, mid, smoothstep(-0.4, 0.3, vH));
          col = mix(col, foam, crest * 0.65);
          // lightning tint
          col += vec3(0.35, 0.45, 0.6) * uFlash * 0.8;
          // distance fade
          float fade = smoothstep(28.0, 12.0, length(vPos.xz));
          col *= 0.35 + fade * 0.65;
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
