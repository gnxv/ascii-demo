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

          // Keplerian angular speed + looped radial inflow (does not drift forever)
          float omega = 3.4 / pow(safeR, 1.5);
          float phase = ang - uTime * omega;
          float inflow = fract(uTime * 0.04 / safeR);   // loops 0..1
          float rAdv = safeR + inflow * 0.8;            // bounded drift

          // Spiral arms (density waves)
          float spiral = sin(phase * 2.0 + log(safeR) * 3.5) * 0.5 + 0.5;

          // Turbulent noise advected with the flow
          vec2 flowUv = vec2(phase * 1.6, rAdv * 2.2);
          float turb = fbm(flowUv);
          float fine = fbm(flowUv * 2.4 + 4.0);

          // Clumps / hot knots
          float clumps = pow(noise(vec2(phase * 3.0, rAdv * 5.0)), 2.2);

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

          return col * intensity;
        }

        void main() {
          vec2 uv = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0) * 2.2;

          // Camera slightly above disk plane, looking at origin
          vec3 ro = vec3(0.0, 1.15, -14.0);
          vec3 rd = normalize(vec3(uv.x, uv.y - 0.05, 1.0));

          vec3 col = vec3(0.0);
          float alpha = 0.0;

          // Simple ray march with gravitational deflection
          vec3 pos = ro;
          vec3 vel = rd;
          const int STEPS = 64;

          for (int i = 0; i < STEPS; i++) {
            float r = length(pos);
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
              // Skip grazing crossings — they make broken geometry on the far side
              float approach = abs(vel.y);
              if (approach < 0.08) {
                pos = next;
                continue;
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

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    })

    const mesh = new THREE.Mesh(geo, mat)
    scene.add(mesh)

    let time = 0
    let animId: number

    const animate = () => {
      animId = requestAnimationFrame(animate)
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
