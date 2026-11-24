'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function Nebula() {
  const mountRef = useRef<HTMLDivElement>(null)
  const visible = useRef(true)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x020308)

    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      80
    )
    camera.position.set(0, 0, 8)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    // Emission nebula volume. Gas glows on its own: hydrogen red, oxygen teal.
    const geo = new THREE.BoxGeometry(16, 12, 16)
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      uniforms: { uTime: { value: 0 } },
      vertexShader: /* glsl */ `
        varying vec3 vWorld;
        void main() {
          vec4 w = modelMatrix * vec4(position, 1.0);
          vWorld = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        varying vec3 vWorld;

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
            mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x),
                mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
            mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
                mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z);
        }
        float fbm(vec3 p) {
          float v = 0.0, a = 0.5;
          for (int i = 0; i < 3; i++) {
            v += a * noise(p);
            p = p * 2.05 + 9.2;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec3 ro = cameraPosition;
          vec3 rd = normalize(vWorld - ro);
          float jitter = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
          vec3 star = vec3(0.4, 0.1, 0.0);

          vec3 col = vec3(0.0);
          float trans = 1.0;
          float t = jitter * 0.4;

          for (int i = 0; i < 18; i++) {
            vec3 p = ro + rd * t;
            vec3 sp = p * 0.32 + vec3(uTime * 0.015, uTime * 0.006, -uTime * 0.012);
            // Noise warped by noise — filaments instead of blobs
            vec3 warp = vec3(fbm(sp + 4.1), fbm(sp + 9.7), fbm(sp + 2.3));
            float d = fbm(sp + warp * 1.4);
            d = smoothstep(0.46, 0.7, d);
            float edge = 1.0 - smoothstep(4.2, 7.2, length(p));
            d *= edge;

            if (d > 0.015) {
              // Dense core hydrogen red, thin gas oxygen blue
              vec3 hAlpha = vec3(0.95, 0.16, 0.18);
              vec3 oxygen = vec3(0.18, 0.5, 0.8);
              vec3 emit = mix(oxygen, hAlpha, smoothstep(0.08, 0.5, d));
              // Embedded star lights the gas around it
              float near = exp(-length(p - star) * 0.55);
              emit += vec3(1.0, 0.85, 0.6) * near * 0.8;
              emit *= mix(0.35, 1.4, d);

              float absorb = exp(-d * 1.1);
              col += trans * emit * d * 0.7;
              trans *= absorb;
              if (trans < 0.04) break;
            }
            t += 0.45;
            if (t > 16.0) break;
          }

          float alpha = 1.0 - trans;
          if (alpha < 0.015) discard;
          gl_FragColor = vec4(col, alpha);
        }
      `,
    })
    const nebula = new THREE.Mesh(geo, mat)
    scene.add(nebula)

    // A few bright stars embedded in the gas
    const starN = 220
    const starPos = new Float32Array(starN * 3)
    for (let i = 0; i < starN; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 10
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 7
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 8
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    const starMat = new THREE.PointsMaterial({
      color: 0xfff6ea,
      size: 0.025,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      sizeAttenuation: true,
    })
    scene.add(new THREE.Points(starGeo, starMat))
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xfff2d0 })
    )
    core.position.set(0.4, 0.1, 0)
    scene.add(core)

    let time = 0
    let animId: number
    const io = new IntersectionObserver(
      ([e]) => { visible.current = e.isIntersecting },
      { threshold: 0.02 }
    )
    io.observe(container)
    const animate = () => {
      animId = requestAnimationFrame(animate)
      if (!visible.current) return
      time += 0.016
      mat.uniforms.uTime.value = time
      camera.position.x = Math.sin(time * 0.05) * 0.6
      camera.position.y = Math.cos(time * 0.04) * 0.3
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
      renderer.dispose()
      geo.dispose()
      mat.dispose()
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
