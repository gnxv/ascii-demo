'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function AsciiBlackHole() {
  const mountRef = useRef<HTMLDivElement>(null)
  const visible = useRef(true)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      300
    )
    camera.position.set(0, 1.4, -16)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25))
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    // Star field far behind (like nebula)
    const dot = document.createElement('canvas')
    dot.width = dot.height = 32
    const dctx = dot.getContext('2d')!
    const g = dctx.createRadialGradient(16, 16, 0, 16, 16, 16)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.35, 'rgba(255,255,255,0.85)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    dctx.fillStyle = g
    dctx.fillRect(0, 0, 32, 32)
    const dotTex = new THREE.CanvasTexture(dot)

    const warm = new THREE.Color(0xffc9a0)
    const cool = new THREE.Color(0xb9d4ff)
    const white = new THREE.Color(0xfff6ea)

    function makeStars(n: number, spread: number, size: number, opacity: number) {
      const pos = new Float32Array(n * 3)
      const phase = new Float32Array(n)
      const freq = new Float32Array(n)
      const col = new Float32Array(n * 3)
      for (let i = 0; i < n; i++) {
        pos[i * 3] = (Math.random() - 0.5) * spread
        pos[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.55
        pos[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.8 - 10 // bias farther back
        phase[i] = Math.random() * Math.PI * 2
        freq[i] = 0.5 + Math.random() * 2.2
        const pick = Math.random()
        const c = pick < 0.22 ? warm : pick < 0.48 ? cool : white
        col[i * 3] = c.r
        col[i * 3 + 1] = c.g
        col[i * 3 + 2] = c.b
      }
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      geo.setAttribute('phase', new THREE.BufferAttribute(phase, 1))
      geo.setAttribute('freq', new THREE.BufferAttribute(freq, 1))
      geo.setAttribute('starColor', new THREE.BufferAttribute(col, 3))
      const mat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: size },
          uOpacity: { value: opacity },
          uMap: { value: dotTex },
        },
        vertexShader: /* glsl */ `
          attribute float phase;
          attribute float freq;
          attribute vec3 starColor;
          uniform float uTime;
          uniform float uSize;
          varying float vTwinkle;
          varying vec3 vColor;
          void main() {
            vColor = starColor;
            float a = sin(uTime * freq + phase);
            float b = sin(uTime * freq * 1.6 + phase * 2.1);
            vTwinkle = 0.82 + 0.18 * (a * 0.55 + b * 0.45);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = uSize * (300.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uOpacity;
          uniform sampler2D uMap;
          varying float vTwinkle;
          varying vec3 vColor;
          void main() {
            float a = texture2D(uMap, gl_PointCoord).a;
            if (a < 0.04) discard;
            gl_FragColor = vec4(vColor, a * uOpacity * vTwinkle);
          }
        `,
      })
      const points = new THREE.Points(geo, mat)
      points.renderOrder = 0
      scene.add(points)
      return { geo, mat, points }
    }

    const faint = makeStars(520, 90, 1.8, 0.65)
    const mid = makeStars(90, 55, 2.8, 0.85)
    const bright = makeStars(18, 40, 4.2, 1.0)

    // Black hole full-screen overlay (transparent background)
    const geo = new THREE.PlaneGeometry(2, 2)
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform vec2 uResolution;
        varying vec2 vUv;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }
        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p *= 2.1;
            a *= 0.5;
          }
          return v;
        }

        vec3 diskColor(vec3 hit, vec3 rayDir) {
          float r = length(hit.xz);
          float outer = 8.0;
          if (r < 1.6 || r > outer) return vec3(0.0);

          float ang = atan(hit.z, hit.x);
          float safeR = max(r, 0.2);

          float omega = 3.4 / pow(safeR, 1.5);
          float turns = uTime * omega / 6.28318;
          float p1 = fract(turns);
          float p2 = fract(turns + 0.5);
          float w = abs(p1 - 0.5) * 2.0;

          float farSide = smoothstep(-0.5, 2.5, hit.z);

          float spiral = sin((ang - p1 * 6.28318) * 2.0 + log(safeR) * 3.5) * 0.5 + 0.5;

          float rCoord = safeR * 0.45;
          vec2 uvA = vec2(ang / 6.28318 - p1, rCoord);
          vec2 uvB = vec2(ang / 6.28318 - p2, rCoord);
          float turb = mix(fbm(uvA * 3.0), fbm(uvB * 3.0), w);
          float fine = mix(fbm(uvA * 6.0 + 4.0), fbm(uvB * 6.0 + 4.0), w);
          fine = mix(fine, turb, farSide * 0.85);

          float clumps = mix(
            pow(noise(uvA * 5.0), 2.2),
            pow(noise(uvB * 5.0), 2.2),
            w
          );
          clumps *= mix(1.0, 0.35, farSide);

          float flow = spiral * 0.35 + turb * 0.4 + fine * 0.15 + clumps * 0.25;
          flow = clamp(flow, 0.0, 1.0);

          float t = smoothstep(outer, 1.8, r);
          vec3 hot = vec3(1.0, 0.88, 0.5);
          vec3 mid = vec3(1.0, 0.38, 0.06);
          vec3 cool = vec3(0.55, 0.04, 0.01);
          vec3 col = mix(cool, mid, smoothstep(0.0, 0.45, t));
          col = mix(col, hot, smoothstep(0.45, 1.0, t));

          vec3 tangent = normalize(vec3(-hit.z, 0.0, hit.x));
          float beta = 0.5 / sqrt(safeR);
          float doppler = 1.0 + 0.85 * beta * dot(tangent, -rayDir);
          doppler = clamp(doppler, 0.65, 1.6);

          float intensity = (0.25 + flow * 1.05) * doppler;
          intensity *= smoothstep(1.6, 2.1, r) * smoothstep(outer, outer * 0.82, r);
          intensity *= 1.0 + 1.4 * smoothstep(3.2, 1.7, r);

          return col * intensity;
        }

        void main() {
          vec2 uv = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0) * 2.2;

          vec3 ro = vec3(0.0, 1.15, -14.0);
          vec3 rd = normalize(vec3(uv.x, uv.y - 0.05, 1.0));

          vec3 col = vec3(0.0);
          float alpha = 0.0;
          float minR = 99.0;

          vec3 pos = ro;
          vec3 vel = rd;
          const int STEPS = 80;

          for (int i = 0; i < STEPS; i++) {
            float r = length(pos);
            minR = min(minR, r);
            if (r < 1.05) break;

            vec3 acc = -2.2 * pos / pow(r, 4.0);
            vel += acc * 0.35;
            vel = normalize(vel) * length(rd);

            vec3 next = pos + vel * 0.22;

            if (pos.y * next.y < 0.0) {
              float t = pos.y / (pos.y - next.y);
              vec3 hit = mix(pos, next, t);
              float hr = length(hit.xz);
              if (hr < 1.7 && hit.z < 0.3) {
                float edge = smoothstep(1.05, 1.55, hr);
                float ring = exp(-pow((hr - 1.5) * 9.0, 2.0));
                col += vec3(1.0, 0.92, 0.75) * ring * 0.7;
                col *= edge;
                alpha = 1.0;
                break;
              }
              vec3 dc = diskColor(hit, vel);
              float a = clamp(length(dc) * 0.55, 0.0, 0.85);
              col += (1.0 - alpha) * dc;
              alpha += (1.0 - alpha) * a;
              if (alpha > 0.95) break;
            }

            pos = next;
            if (r > 30.0) break;
          }

          // Only disk/hole, transparent background so 3D stars show through
          gl_FragColor = vec4(col, alpha);
        }
      `,
    })

    const mesh = new THREE.Mesh(geo, mat)
    mesh.renderOrder = 1
    scene.add(mesh)

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
      faint.mat.uniforms.uTime.value = time
      mid.mat.uniforms.uTime.value = time
      bright.mat.uniforms.uTime.value = time
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      mat.uniforms.uResolution.value.set(w, h)
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
