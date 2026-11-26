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
            p *= 2.05;
            a *= 0.5;
          }
          return v;
        }

        vec3 diskColor(vec3 hit, vec3 rayDir) {
          float r = length(hit.xz);
          float outer = 8.0;
          if (r < 1.55 || r > outer) return vec3(0.0);

          // Continuous angle (avoid branch cut on negative X)
          float ang = atan(hit.z, hit.x);
          // Offset so discontinuity is less visible / we blend across it
          float angNorm = ang / 6.28318;
          float safeR = max(r, 0.2);

          // Mild differential rotation
          float omega = 2.4 / pow(safeR, 1.3);
          float turns = uTime * omega * 0.15; // slower overall
          float p1 = fract(turns);
          float p2 = fract(turns + 0.5);
          // Smoother crossfade weight
          float w = smoothstep(0.0, 0.5, abs(p1 - 0.5)) * 2.0;
          w = clamp(w, 0.0, 1.0);

          float farSide = smoothstep(-0.3, 2.0, hit.z);

          // Spiral with continuous phase (sin is naturally continuous)
          float spiral = sin((ang - turns * 6.28318) * 1.2 + log(safeR) * 1.6) * 0.5 + 0.5;

          // Noise UVs — use continuous turns instead of fract for main motion
          float rCoord = safeR * 0.36;
          vec2 uvA = vec2(angNorm - turns * 0.65, rCoord);
          vec2 uvB = vec2(angNorm - (turns + 0.5) * 0.65, rCoord);

          float turb = mix(fbm(uvA * 2.4), fbm(uvB * 2.4), w);
          float fine = mix(fbm(uvA * 4.2 + 2.0), fbm(uvB * 4.2 + 2.0), w);
          fine = mix(fine, turb, farSide * 0.65);

          float clumps = mix(
            pow(noise(uvA * 3.4), 1.8),
            pow(noise(uvB * 3.4), 1.8),
            w
          );
          clumps *= mix(1.0, 0.45, farSide);

          float flow = spiral * 0.25 + turb * 0.45 + fine * 0.1 + clumps * 0.15;
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
          intensity *= smoothstep(1.55, 2.05, r) * smoothstep(outer, outer * 0.82, r);
          intensity *= 1.0 + 1.4 * smoothstep(3.2, 1.7, r);

          return col * intensity;
        }

        void main() {
          vec2 uv = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0) * 2.15;

          // Restored low side-on camera that kept stable full disk form
          vec3 ro = vec3(0.0, 1.15, -14.0);
          vec3 rd = normalize(vec3(uv.x, uv.y - 0.05, 1.0));

          vec3 col = vec3(0.0);
          float alpha = 0.0;

          vec3 pos = ro;
          vec3 vel = rd;
          const int STEPS = 85;

          for (int i = 0; i < STEPS; i++) {
            float r = length(pos);
            if (r < 1.05) {
              alpha = 1.0;
              break;
            }

            vec3 acc = -2.2 * pos / max(pow(r, 4.0), 0.01);
            vel += acc * 0.35;
            vel = normalize(vel) * length(rd);

            vec3 next = pos + vel * 0.22;

            if (pos.y * next.y < 0.0) {
              float t = pos.y / (pos.y - next.y);
              vec3 hit = mix(pos, next, t);
              float hr = length(hit.xz);

              if (hr < 1.52) {
                alpha = 1.0;
                float ring = exp(-pow((hr - 1.48) * 14.0, 2.0));
                col += vec3(1.0, 0.94, 0.78) * ring * 0.5;
                break;
              }

              vec3 dc = diskColor(hit, vel);
              float a = clamp(length(dc) * 0.5, 0.0, 0.82);
              col += (1.0 - alpha) * dc;
              alpha += (1.0 - alpha) * a;
              if (alpha > 0.94) break;
            }

            pos = next;
            if (r > 30.0) break;
          }

          float a = max(alpha, smoothstep(0.01, 0.1, length(col)));
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
