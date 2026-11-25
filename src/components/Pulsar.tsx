'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function Pulsar() {
  const mountRef = useRef<HTMLDivElement>(null)
  const visible = useRef(true)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x020308)
    scene.add(new THREE.AmbientLight(0x223344, 0.4))

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      80
    )
    camera.position.set(0, 1.4, 9)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1))
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    // Neutron star
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xfff4e8 })
    )
    scene.add(core)
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 24, 24),
      new THREE.MeshBasicMaterial({
        color: 0xffc9a0,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )
    scene.add(glow)

    // Beams are light, not solid cones: narrow on axis, soft edge, fade with distance
    const beams = new THREE.Group()
    beams.rotation.z = 0.62
    const beamMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: { uPulse: { value: 0.3 } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        varying vec3 vPos;
        void main() {
          vUv = uv;
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uPulse;
        varying vec2 vUv;
        varying vec3 vPos;
        void main() {
          float along = vUv.y;
          float radial = length(vPos.xz);
          float core = exp(-radial * radial * 18.0);
          float edge = exp(-radial * radial * 4.0) * 0.35;
          float fade = exp(-along * 1.6) * smoothstep(0.0, 0.08, along);
          float beam = (core + edge) * fade;
          vec3 col = mix(vec3(0.55, 0.75, 1.0), vec3(1.0, 0.95, 0.85), core);
          float alpha = beam * (0.35 + uPulse * 0.9);
          if (alpha < 0.02) discard;
          gl_FragColor = vec4(col * beam, alpha);
        }
      `,
    })
    function makeBeam(dir: number) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.7, 8, 32, 1, true), beamMat)
      cone.position.y = dir * 4.1
      if (dir < 0) cone.rotation.x = Math.PI
      return cone
    }
    beams.add(makeBeam(1))
    beams.add(makeBeam(-1))
    scene.add(beams)

    // Soft core flash when a beam sweeps the camera
    const flash = new THREE.PointLight(0xcfe4ff, 0, 12)
    scene.add(flash)

    // Star field
    const dot = document.createElement('canvas')
    dot.width = dot.height = 32
    const dctx = dot.getContext('2d')!
    const g = dctx.createRadialGradient(16, 16, 0, 16, 16, 16)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.45, 'rgba(255,255,255,0.7)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    dctx.fillStyle = g
    dctx.fillRect(0, 0, 32, 32)
    const dotTex = new THREE.CanvasTexture(dot)
    const starN = 280
    const starPos = new Float32Array(starN * 3)
    for (let i = 0; i < starN; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 24
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 16
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 16 - 4
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    const starMat = new THREE.PointsMaterial({
      color: 0xfff6ea,
      size: 2.2,
      map: dotTex,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    scene.add(new THREE.Points(starGeo, starMat))

    let time = 0
    let animId: number
    const io = new IntersectionObserver(
      ([e]) => { visible.current = e.isIntersecting },
      { threshold: 0.02 }
    )
    io.observe(container)

    const axis = new THREE.Vector3(0, 1, 0)
    const toCam = new THREE.Vector3()
    const animate = () => {
      animId = requestAnimationFrame(animate)
      if (!visible.current) return
      time += 0.016
      beams.rotation.y = time * 0.7
      // Pulse when a magnetic pole faces the camera
      axis.set(0, 1, 0).transformDirection(beams.matrixWorld)
      toCam.copy(camera.position).normalize()
      const facing = Math.abs(axis.dot(toCam))
      const pulse = Math.pow(facing, 6)
      beamMat.uniforms.uPulse.value = 0.15 + pulse * 0.85
      glow.scale.setScalar(1 + pulse * 0.35)
      flash.intensity = pulse * 6
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
      renderer.dispose()
      core.geometry.dispose()
      ;(core.material as THREE.Material).dispose()
      glow.geometry.dispose()
      ;(glow.material as THREE.Material).dispose()
      beamMat.dispose()
      starGeo.dispose()
      starMat.dispose()
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, background: '#020308' }}
    />
  )
}
