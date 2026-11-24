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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1))
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    // Emission nebula volume. Gas glows on its own: hydrogen red, oxygen teal.
    const geo = new THREE.BoxGeometry(16, 12, 16)
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      uniforms: { uTime: { value: 0 }, uSeed: { value: new THREE.Vector3(Math.random() * 100, Math.random() * 100, Math.random() * 100) } },
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
        uniform vec3 uSeed;
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

          vec3 col = vec3(0.0);
          float trans = 1.0;
          float t = jitter * 0.18;

          for (int i = 0; i < 16; i++) {
            vec3 p = ro + rd * t;
            // Spiral vortices, same idea as the black hole disk
            float r = length(p.xz);
            float ang = atan(p.z, p.x) + uTime * 0.04 + r * 0.55;
            vec3 twisted = vec3(cos(ang) * r, p.y, sin(ang) * r);
            // A few funnels: gas spins tighter near each center
            vec3 funnel = vec3(0.0);
            for (int k = 0; k < 3; k++) {
              vec3 c = vec3(sin(float(k) * 2.1 + uSeed.x), 0.3 * sin(float(k)), cos(float(k) * 1.7)) * 2.2;
              vec3 q = twisted - c;
              float qr = length(q.xz) + 0.3;
              float spin = uTime * 0.3 + 2.4 / qr;
              float ca = cos(spin), sa = sin(spin);
              q.xz = mat2(ca, -sa, sa, ca) * q.xz;
              funnel += q * exp(-qr * 0.6);
            }
            vec3 sp = (twisted + funnel) * 0.35
              + uSeed
              + vec3(uTime * 0.015, uTime * 0.006, -uTime * 0.01);
            float d = fbm(sp);
            d = smoothstep(0.38, 0.62, d);
            // Fade at the edges of the volume
            float edge = 1.0 - smoothstep(4.5, 7.5, length(p));
            d *= edge;

            if (d > 0.02) {
              // Hydrogen core, oxygen in the thinner gas
              vec3 hAlpha = vec3(0.85, 0.18, 0.22);
              vec3 oxygen = vec3(0.25, 0.55, 0.75);
              vec3 dust = vec3(0.35, 0.12, 0.28);
              vec3 emit = mix(oxygen, hAlpha, smoothstep(0.15, 0.55, d));
              emit = mix(emit, dust, smoothstep(0.55, 0.85, d) * 0.4);

              float absorb = exp(-d * 0.7);
              col += trans * emit * d * 0.55;
              trans *= absorb;
              if (trans < 0.04) break;
            }
            t += 0.5;
            if (t > 16.0) break;
          }

          float alpha = 1.0 - trans;
          if (alpha < 0.02) discard;
          gl_FragColor = vec4(col, alpha * 0.92);
        }
      `,
    })
    const nebula = new THREE.Mesh(geo, mat)
    scene.add(nebula)

    // Star field: many faint, a few bright
    const dot = document.createElement('canvas')
    dot.width = dot.height = 32
    const dctx = dot.getContext('2d')!
    const g = dctx.createRadialGradient(16, 16, 0, 16, 16, 16)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.4, 'rgba(255,255,255,0.8)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    dctx.fillStyle = g
    dctx.fillRect(0, 0, 32, 32)
    const dotTex = new THREE.CanvasTexture(dot)

    function makeStars(n: number, spread: number, size: number, color: number, opacity: number) {
      const pos = new Float32Array(n * 3)
      const phase = new Float32Array(n)
      for (let i = 0; i < n; i++) {
        pos[i * 3] = (Math.random() - 0.5) * spread
        pos[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.7
        pos[i * 3 + 2] = (Math.random() - 0.5) * spread
        phase[i] = Math.random() * Math.PI * 2
      }
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      geo.setAttribute('phase', new THREE.BufferAttribute(phase, 1))
      const mat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: size },
          uColor: { value: new THREE.Color(color) },
          uOpacity: { value: opacity },
          uMap: { value: dotTex },
        },
        vertexShader: /* glsl */ `
          attribute float phase;
          uniform float uTime;
          uniform float uSize;
          varying float vTwinkle;
          void main() {
            vTwinkle = 0.65 + 0.35 * sin(uTime * 1.4 + phase);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = uSize * vTwinkle;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uOpacity;
          uniform sampler2D uMap;
          varying float vTwinkle;
          void main() {
            float a = texture2D(uMap, gl_PointCoord).a;
            if (a < 0.05) discard;
            gl_FragColor = vec4(uColor, a * uOpacity * vTwinkle);
          }
        `,
      })
      scene.add(new THREE.Points(geo, mat))
      return { geo, mat }
    }
    const faint = makeStars(400, 22, 2.2, 0xfff6ea, 0.7)
    const mid = makeStars(60, 14, 3.4, 0xffe8c8, 0.9)
    const bright = makeStars(12, 10, 5.0, 0xffffff, 1)

    let time = Math.random() * 200
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
      faint.mat.uniforms.uTime.value = time
      mid.mat.uniforms.uTime.value = time
      bright.mat.uniforms.uTime.value = time
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
      faint.geo.dispose(); faint.mat.dispose()
      mid.geo.dispose(); mid.mat.dispose()
      bright.geo.dispose(); bright.mat.dispose()
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
