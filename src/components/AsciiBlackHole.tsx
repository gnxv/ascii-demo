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

        // Hash noise
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

        // Realistic-ish accretion disk sample
        vec3 diskColor(vec3 hit, vec3 rayDir) {
          float r = length(hit.xz);
          float outer = 8.0;
          if (r < 1.6 || r > outer) return vec3(0.0);

          float ang = atan(hit.z, hit.x);
          float safeR = max(r, 0.2);

          // Keplerian dual-phase. Weight of a phase is 0 exactly when it wraps,
          // so the pattern never jumps and never shears more than half an orbit.
          float omega = 3.4 / pow(safeR, 1.5);
          float turns = uTime * omega / 6.28318;
          float p1 = fract(turns);
          float p2 = fract(turns + 0.5);
          float w = abs(p1 - 0.5) * 2.0;   // 1 at wrap of p1, 0 at wrap of p2

          float farSide = smoothstep(-0.5, 2.5, hit.z);

          // Spiral on the continuous wrapped phase
          float spiral = sin((ang - p1 * 6.28318) * 2.0 + log(safeR) * 3.5) * 0.5 + 0.5;

          // Fixed radial coord — no accumulating / jumping r
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

          // Temperature: hot inside, cooler outside
          float t = smoothstep(outer, 1.8, r);
          vec3 hot = vec3(1.0, 0.88, 0.5);
          vec3 mid = vec3(1.0, 0.38, 0.06);
          vec3 cool = vec3(0.55, 0.04, 0.01);
          vec3 col = mix(cool, mid, smoothstep(0.0, 0.45, t));
          col = mix(col, hot, smoothstep(0.45, 1.0, t));

          // Doppler beaming
          vec3 tangent = normalize(vec3(-hit.z, 0.0, hit.x));
          float beta = 0.5 / sqrt(safeR);
          float doppler = 1.0 + 0.85 * beta * dot(tangent, -rayDir);
          doppler = clamp(doppler, 0.65, 1.6);

          float intensity = (0.25 + flow * 1.05) * doppler;
          intensity *= smoothstep(1.6, 2.1, r) * smoothstep(outer, outer * 0.82, r);
          // Hottest at the inner edge
          intensity *= 1.0 + 1.4 * smoothstep(3.2, 1.7, r);

          return col * intensity;
        }

        void main() {
          vec2 uv = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0) * 2.2;

          // Camera slightly above disk plane, looking at origin
          vec3 ro = vec3(0.0, 1.15, -14.0);
          vec3 rd = normalize(vec3(uv.x, uv.y - 0.05, 1.0));

          vec3 col = vec3(0.0);
          float alpha = 0.0;
          float minR = 99.0;

          // Simple ray march with gravitational deflection
          vec3 pos = ro;
          vec3 vel = rd;
          const int STEPS = 64;

          for (int i = 0; i < STEPS; i++) {
            float r = length(pos);
            minR = min(minR, r);
            if (r < 1.05) break; // captured

            // Deflection toward center (approx Schwarzschild)
            vec3 acc = -1.8 * pos / pow(r, 4.0);
            vel += acc * 0.4;
            vel = normalize(vel) * length(rd);

            vec3 next = pos + vel * 0.28;

            // Plane crossing = disk hit
            if (pos.y * next.y < 0.0) {
              float t = pos.y / (pos.y - next.y);
              vec3 hit = mix(pos, next, t);
              float hr = length(hit.xz);
              // The hole itself, soft edge, ring on the rim
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

          // Stars on the bent ray. Same gravity that bends the disk moves them.
          vec3 dir = normalize(vel);
          vec3 starCol = vec3(0.0);
          for (int i = 0; i < 36; i++) {
            float fi = float(i);
            float h1 = fract(sin(fi * 12.9898) * 43758.5453);
            float h2 = fract(sin(fi * 78.233) * 24634.6345);
            float h3 = fract(sin(fi * 39.346) * 13976.312);
            vec3 sd = normalize(vec3(h1 * 2.0 - 1.0, h2 * 0.8 - 0.4, 0.2 + h3));
            float d = length(dir - sd);
            float s = exp(-d * d * 160.0);
            vec3 c = mix(vec3(1.0, 0.94, 0.82), vec3(0.7, 0.84, 1.0), step(0.5, h3));
            starCol += c * s * (0.7 + h1);
          }
          float outside = step(1.45, minR) * (1.0 - alpha);
          col += starCol * outside;
          float a = max(alpha, smoothstep(0.02, 0.2, length(col)));
          gl_FragColor = vec4(col, max(a, outside * smoothstep(0.02, 0.15, length(starCol))));
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
