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
      42,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      400
    )
    camera.position.set(0, 1.2, -18)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
      alpha: true,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25))
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    // Soft dot texture for stars
    const dot = document.createElement('canvas')
    dot.width = dot.height = 64
    const dctx = dot.getContext('2d')!
    const g = dctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.25, 'rgba(255,255,255,0.9)')
    g.addColorStop(0.6, 'rgba(255,255,255,0.3)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    dctx.fillStyle = g
    dctx.fillRect(0, 0, 64, 64)
    const dotTex = new THREE.CanvasTexture(dot)

    const warm = new THREE.Color(0xffd0a8)
    const cool = new THREE.Color(0xc0d8ff)
    const white = new THREE.Color(0xfff8f0)

    function makeStars(count: number, spread: number, baseSize: number, opacity: number) {
      const positions = new Float32Array(count * 3)
      const phases = new Float32Array(count)
      const freqs = new Float32Array(count)
      const colors = new Float32Array(count * 3)

      for (let i = 0; i < count; i++) {
        // Spread far behind the hole
        positions[i * 3] = (Math.random() - 0.5) * spread
        positions[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.5
        positions[i * 3 + 2] = 30 + Math.random() * spread * 0.7  // far behind the hole

        phases[i] = Math.random() * Math.PI * 2
        freqs[i] = 0.6 + Math.random() * 2.0

        const pick = Math.random()
        const c = pick < 0.25 ? warm : pick < 0.5 ? cool : white
        colors[i * 3] = c.r
        colors[i * 3 + 1] = c.g
        colors[i * 3 + 2] = c.b
      }

      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geo.setAttribute('phase', new THREE.BufferAttribute(phases, 1))
      geo.setAttribute('freq', new THREE.BufferAttribute(freqs, 1))
      geo.setAttribute('starColor', new THREE.BufferAttribute(colors, 3))

      const mat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: baseSize },
          uOpacity: { value: opacity },
          uMap: { value: dotTex },
        },
        vertexShader: `
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
            float b = sin(uTime * freq * 1.7 + phase * 1.3);
            vTwinkle = 0.8 + 0.2 * (a * 0.6 + b * 0.4);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = uSize * (280.0 / max(-mv.z, 1.0));
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          uniform float uOpacity;
          uniform sampler2D uMap;
          varying float vTwinkle;
          varying vec3 vColor;
          void main() {
            float a = texture2D(uMap, gl_PointCoord).a;
            if (a < 0.05) discard;
            gl_FragColor = vec4(vColor, a * uOpacity * vTwinkle);
          }
        `,
      })

      const points = new THREE.Points(geo, mat)
      points.renderOrder = 0
      scene.add(points)
      return { geo, mat, points }
    }

    const starsFar = makeStars(600, 110, 1.6, 0.7)
    const starsMid = makeStars(120, 70, 2.4, 0.85)
    const starsBright = makeStars(22, 45, 3.6, 1.0)

    // Full-screen black hole shader (transparent outside the disk)
    const planeGeo = new THREE.PlaneGeometry(2, 2)
    const holeMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
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
          vec2 uv = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0) * 2.0;

          vec3 ro = vec3(0.0, 1.1, -15.0);
          vec3 rd = normalize(vec3(uv.x, uv.y - 0.04, 1.0));

          vec3 col = vec3(0.0);
          float alpha = 0.0;

          vec3 pos = ro;
          vec3 vel = rd;
          const int STEPS = 72;

          for (int i = 0; i < STEPS; i++) {
            float r = length(pos);
            if (r < 1.05) break;

            vec3 acc = -2.1 * pos / pow(r, 4.0);
            vel += acc * 0.32;
            vel = normalize(vel) * length(rd);

            vec3 next = pos + vel * 0.24;

            if (pos.y * next.y < 0.0) {
              float t = pos.y / (pos.y - next.y);
              vec3 hit = mix(pos, next, t);
              float hr = length(hit.xz);
              if (hr < 1.65 && hit.z < 0.4) {
                float edge = smoothstep(1.05, 1.5, hr);
                float ring = exp(-pow((hr - 1.48) * 10.0, 2.0));
                col += vec3(1.0, 0.92, 0.75) * ring * 0.65;
                col *= edge;
                alpha = 1.0;
                break;
              }
              vec3 dc = diskColor(hit, vel);
              float a = clamp(length(dc) * 0.5, 0.0, 0.8);
              col += (1.0 - alpha) * dc;
              alpha += (1.0 - alpha) * a;
              if (alpha > 0.92) break;
            }

            pos = next;
            if (r > 28.0) break;
          }

          // Transparent everywhere except the accretion disk and the hole itself
          gl_FragColor = vec4(col, alpha);
        }
      `,
    })

    const holeMesh = new THREE.Mesh(planeGeo, holeMat)
    holeMesh.renderOrder = 10
    scene.add(holeMesh)

    let time = 0
    let animId: number

    const io = new IntersectionObserver(
      ([e]) => { visible.current = e.isIntersecting },
      { threshold: 0.01 }
    )
    io.observe(container)

    const animate = () => {
      animId = requestAnimationFrame(animate)
      if (!visible.current) return
      time += 0.016
      holeMat.uniforms.uTime.value = time
      starsFar.mat.uniforms.uTime.value = time
      starsMid.mat.uniforms.uTime.value = time
      starsBright.mat.uniforms.uTime.value = time
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      if (w === 0 || h === 0) return
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      holeMat.uniforms.uResolution.value.set(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      io.disconnect()
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      planeGeo.dispose()
      holeMat.dispose()
      starsFar.geo.dispose(); starsFar.mat.dispose()
      starsMid.geo.dispose(); starsMid.mat.dispose()
      starsBright.geo.dispose(); starsBright.mat.dispose()
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
