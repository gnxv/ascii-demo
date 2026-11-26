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

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25))
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    const geo = new THREE.PlaneGeometry(2, 2)
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
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
          float outer = 8.5;
          if (r < 1.6 || r > outer) return vec3(0.0);

          float ang = atan(hit.z, hit.x);
          float safeR = max(r, 0.2);

          float omega = 3.2 / pow(safeR, 1.5);
          float turns = uTime * omega / 6.28318;
          float p1 = fract(turns);
          float p2 = fract(turns + 0.5);
          float w = abs(p1 - 0.5) * 2.0;

          float spiral = sin((ang - p1 * 6.28318) * 2.0 + log(safeR) * 3.2) * 0.5 + 0.5;

          float rCoord = safeR * 0.42;
          vec2 uvA = vec2(ang / 6.28318 - p1, rCoord);
          vec2 uvB = vec2(ang / 6.28318 - p2, rCoord);
          float turb = mix(fbm(uvA * 3.0), fbm(uvB * 3.0), w);
          float fine = mix(fbm(uvA * 6.0 + 4.0), fbm(uvB * 6.0 + 4.0), w);

          float clumps = mix(
            pow(noise(uvA * 5.0), 2.2),
            pow(noise(uvB * 5.0), 2.2),
            w
          );

          float flow = spiral * 0.32 + turb * 0.42 + fine * 0.16 + clumps * 0.22;
          flow = clamp(flow, 0.0, 1.0);

          float t = smoothstep(outer, 1.9, r);
          vec3 hot = vec3(1.0, 0.86, 0.48);
          vec3 mid = vec3(1.0, 0.36, 0.05);
          vec3 cool = vec3(0.5, 0.035, 0.008);
          vec3 col = mix(cool, mid, smoothstep(0.0, 0.4, t));
          col = mix(col, hot, smoothstep(0.4, 1.0, t));

          vec3 tangent = normalize(vec3(-hit.z, 0.0, hit.x));
          float beta = 0.48 / sqrt(safeR);
          float doppler = 1.0 + 0.8 * beta * dot(tangent, -rayDir);
          doppler = clamp(doppler, 0.62, 1.55);

          float intensity = (0.25 + flow * 1.1) * doppler;
          intensity *= smoothstep(1.6, 2.15, r) * smoothstep(outer, outer * 0.75, r);
          intensity *= 1.0 + 1.4 * smoothstep(3.2, 1.75, r);

          return col * intensity;
        }

        void main() {
          vec2 uv = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0) * 1.85;

          // Classic elevated side view — good disk geometry, both near and far side visible
          vec3 ro = vec3(0.0, 2.8, -9.8);
          vec3 rd = normalize(vec3(uv.x * 0.92, uv.y - 0.15, 1.0));

          vec3 col = vec3(0.0);
          float alpha = 0.0;

          vec3 pos = ro;
          vec3 vel = rd;
          const int STEPS = 100;

          for (int i = 0; i < STEPS; i++) {
            float r = length(pos);
            if (r < 1.1) {
              alpha = 1.0;
              break;
            }

            vec3 acc = -1.35 * pos / max(pow(r, 4.0), 0.08);
            vel += acc * 0.22;
            vel = normalize(vel) * length(rd);

            vec3 next = pos + vel * 0.13;

            if (pos.y * next.y < 0.0) {
              float t = pos.y / (pos.y - next.y);
              vec3 hit = mix(pos, next, t);
              float hr = length(hit.xz);

              if (hr < 1.65) {
                float ring = exp(-pow((hr - 1.52) * 16.0, 2.0));
                col += vec3(1.0, 0.92, 0.75) * ring * 0.55 * (1.0 - alpha);
                alpha = max(alpha, 0.4 + ring * 0.45);
                if (hr < 1.25) {
                  alpha = 1.0;
                  break;
                }
              } else {
                vec3 dc = diskColor(hit, vel);
                float a = clamp(length(dc) * 0.55, 0.0, 0.82);
                col += (1.0 - alpha) * dc;
                alpha += (1.0 - alpha) * a;
                if (alpha > 0.95) break;
              }
            }

            pos = next;
            if (r > 25.0) break;
          }

          float a = max(alpha, smoothstep(0.008, 0.08, length(col)));
          gl_FragColor = vec4(col, a);
        }
      `,
    })

    const mesh = new THREE.Mesh(geo, mat)
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
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
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
