'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function AsciiBlackHole() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      50
    )
    camera.position.set(0, 1.2, 14)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    // Event horizon
    const horizon = new THREE.Mesh(
      new THREE.SphereGeometry(1.15, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    )
    scene.add(horizon)

    // Photon ring
    const ringGeo = new THREE.RingGeometry(1.28, 1.42, 64)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffe0a0,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    })
    const photonRing = new THREE.Mesh(ringGeo, ringMat)
    photonRing.rotation.x = Math.PI / 2.4
    scene.add(photonRing)

    // Accretion disk
    const diskGeo = new THREE.RingGeometry(1.6, 5.8, 96, 8)
    const diskMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        varying float vRadius;
        void main() {
          vUv = uv;
          vec3 pos = position;
          float r = length(pos.xy);
          vRadius = r;
          // slight warp
          pos.z += sin(r * 1.8 + uv.x * 6.28) * 0.12;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        varying vec2 vUv;
        varying float vRadius;

        void main() {
          float r = vRadius;
          float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
          float spin = uTime * 1.4;

          // Doppler-ish brightness
          float doppler = 0.65 + 0.35 * sin(angle + spin);

          // Color: hot white-yellow near center -> orange -> red
          vec3 col = mix(vec3(1.0, 0.95, 0.7), vec3(1.0, 0.45, 0.1), smoothstep(1.8, 4.2, r));
          col = mix(col, vec3(0.8, 0.15, 0.05), smoothstep(3.8, 5.6, r));

          float bands = 0.75 + 0.25 * sin(r * 8.0 - spin * 2.0 + angle * 3.0);
          float alpha = smoothstep(5.8, 4.5, r) * smoothstep(1.55, 2.1, r) * doppler * bands;

          gl_FragColor = vec4(col * (0.6 + doppler * 0.8), alpha * 0.85);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    const disk = new THREE.Mesh(diskGeo, diskMat)
    disk.rotation.x = Math.PI / 2.35
    scene.add(disk)

    // Jets
    const jetGeo = new THREE.ConeGeometry(0.35, 4.2, 12, 1, true)
    const jetMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: /* glsl */ `
        varying float vY;
        void main() {
          vY = position.y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        varying float vY;
        void main() {
          float pulse = 0.6 + 0.4 * sin(uTime * 3.0 + vY * 2.0);
          float fade = smoothstep(2.1, -1.8, vY);
          vec3 col = vec3(0.6, 0.85, 1.0) * pulse;
          gl_FragColor = vec4(col, fade * 0.55);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    const jetUp = new THREE.Mesh(jetGeo, jetMat)
    jetUp.position.y = 2.4
    scene.add(jetUp)
    const jetDown = new THREE.Mesh(jetGeo, jetMat)
    jetDown.position.y = -2.4
    jetDown.rotation.x = Math.PI
    scene.add(jetDown)

    // Infalling particles
    const PARTICLE_COUNT = 80
    const particles: { angle: number; radius: number; speed: number; y: number }[] = []
    const pPositions = new Float32Array(PARTICLE_COUNT * 3)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        angle: Math.random() * Math.PI * 2,
        radius: 2.2 + Math.random() * 3.5,
        speed: 0.4 + Math.random() * 0.8,
        y: (Math.random() - 0.5) * 0.6,
      })
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3))
    const pMat = new THREE.PointsMaterial({
      color: 0xffcc88,
      size: 0.08,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const points = new THREE.Points(pGeo, pMat)
    scene.add(points)

    let time = 0
    let animId: number

    const animate = () => {
      animId = requestAnimationFrame(animate)
      time += 0.016

      diskMat.uniforms.uTime.value = time
      jetMat.uniforms.uTime.value = time

      disk.rotation.z = time * 0.15
      photonRing.rotation.z = time * 0.25

      // Update particles
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i]
        p.angle += p.speed * 0.02
        p.radius -= 0.008 * p.speed
        if (p.radius < 1.35) {
          p.radius = 2.4 + Math.random() * 3.2
          p.angle = Math.random() * Math.PI * 2
        }
        pPositions[i * 3] = Math.cos(p.angle) * p.radius
        pPositions[i * 3 + 1] = p.y + Math.sin(time + i) * 0.05
        pPositions[i * 3 + 2] = Math.sin(p.angle) * p.radius * 0.35
      }
      pGeo.attributes.position.needsUpdate = true

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
      renderer.dispose()
      horizon.geometry.dispose()
      ;(horizon.material as THREE.Material).dispose()
      ringGeo.dispose()
      ringMat.dispose()
      diskGeo.dispose()
      diskMat.dispose()
      jetGeo.dispose()
      jetMat.dispose()
      pGeo.dispose()
      pMat.dispose()
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
        background: '#000',
      }}
    />
  )
}
