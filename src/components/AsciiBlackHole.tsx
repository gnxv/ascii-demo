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
          float outer = 10.5;
          if (r < 1.5 || r > outer) return vec3(0.0);

          float ang = atan(hit.z, hit.x);
          float safeR = max(r, 0.2);

          float omega = 3.4 / pow(safeR, 1.5);
          float turns = uTime * omega / 6.28318;
          float p1 = fract(turns);
          float p2 = fract(turns + 0.5);
          float w = abs(p1 - 0.5) * 2.0;

          // Less aggressive far-side dimming so lower part stays visible
          float farSide = smoothstep(0.0, 4.0, hit.z);

          float spiral = sin((ang - p1 * 6.28318) * 2.0 + log(safeR) * 3.5) * 0.5 + 0.5;

          float rCoord = safeR * 0.42;
          vec2 uvA = vec2(ang / 6.28318 - p1, rCoord);
          vec2 uvB = vec2(ang / 6.28318 - p2, rCoord);
          float turb = mix(fbm(uvA * 3.0), fbm(uvB * 3.0), w);
          float fine = mix(fbm(uvA * 6.0 + 4.0), fbm(uvB * 6.0 + 4.0), w);
          fine = mix(fine, turb, farSide * 0.55);

          float clumps = mix(
            pow(noise(uvA * 5.0), 2.2),
            pow(noise(uvB * 5.0), 2.2),
            w
          );
          clumps *= mix(1.0, 0.55, farSide);

          float flow = spiral * 0.35 + turb * 0.4 + fine * 0.15 + clumps * 0.25;
          flow = clamp(flow, 0.0, 1.0);

          float t = smoothstep(outer, 1.9, r);
          vec3 hot = vec3(1.0, 0.88, 0.5);
          vec3 mid = vec3(1.0, 0.38, 0.06);
          vec3 cool = vec3(0.55, 0.04, 0.01);
          vec3 col = mix(cool, mid, smoothstep(0.0, 0.45, t));
          col = mix(col, hot, smoothstep(0.45, 1.0, t));

          vec3 tangent = normalize(vec3(-hit.z, 0.0, hit.x));
          float beta = 0.5 / sqrt(safeR);
          float doppler = 1.0 + 0.85 * beta * dot(tangent, -rayDir);
          doppler = clamp(doppler, 0.65, 1.6);

          float intensity = (0.28 + flow * 1.1) * doppler;
          intensity *= smoothstep(1.5, 2.0, r) * smoothstep(outer, outer * 0.78, r);
          intensity *= 1.0 + 1.3 * smoothstep(3.5, 1.75, r);
          // Boost far side a bit so lower part doesn't vanish
          intensity *= mix(1.0, 1.25, farSide);

          return col * intensity;
        }

        vec3 sampleStars(vec2 suv, float density) {
          vec3 starCol = vec3(0.0);
          vec2 base = floor(suv);
          vec2 fr = fract(suv);
          for (int j = -1; j <= 1; j++) {
            for (int i = -1; i <= 1; i++) {
              vec2 cell = base + vec2(float(i), float(j));
              float h = hash(cell);
              if (h > density) {
                vec2 jitter = vec2(
                  hash(cell + vec2(1.3, 2.7)),
                  hash(cell + vec2(4.1, 0.9))
                );
                vec2 local = fr - vec2(float(i), float(j)) - jitter;
                float d = length(local);
                float size = mix(160.0, 340.0, hash(cell + 5.0));
                float s = exp(-d * d * size);
                float huePick = hash(cell + 9.0);
                vec3 c = mix(vec3(1.0, 0.85, 0.65), vec3(0.7, 0.85, 1.0), step(0.5, huePick));
                if (huePick > 0.75) c = vec3(1.0, 0.98, 0.92);
                float tw = 0.76 + 0.24 * sin(uTime * (1.5 + hash(cell)*1.9) + hash(cell)*6.28);
                starCol += c * s * (0.28 + h * 0.85) * tw;
              }
            }
          }
          return starCol;
        }

        void main() {
          vec2 uv = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0) * 2.05;

          vec3 ro = vec3(0.0, 1.05, -15.5);
          vec3 rd = normalize(vec3(uv.x, uv.y - 0.03, 1.0));

          vec3 col = vec3(0.0);
          float alpha = 0.0;
          float minR = 99.0;

          vec3 pos = ro;
          vec3 vel = rd;
          const int STEPS = 90;

          for (int i = 0; i < STEPS; i++) {
            float r = length(pos);
            minR = min(minR, r);
            if (r < 1.05) break;

            vec3 acc = -2.2 * pos / pow(r, 4.0);
            vel += acc * 0.32;
            vel = normalize(vel) * length(rd);

            vec3 next = pos + vel * 0.2;

            if (pos.y * next.y < 0.0) {
              float t = pos.y / (pos.y - next.y);
              vec3 hit = mix(pos, next, t);
              float hr = length(hit.xz);

              if (hr < 1.48) {
                alpha = 1.0;
                float ring = exp(-pow((hr - 1.45) * 16.0, 2.0));
                col += vec3(1.0, 0.94, 0.78) * ring * 0.48;
                break;
              }

              vec3 dc = diskColor(hit, vel);
              float a = clamp(length(dc) * 0.48, 0.0, 0.8);
              col += (1.0 - alpha) * dc;
              alpha += (1.0 - alpha) * a;
              if (alpha > 0.93) break;
            }

            pos = next;
            if (r > 32.0) break;
          }

          vec3 dir = normalize(vel);
          vec2 suv = vec2(atan(dir.z, dir.x), asin(clamp(dir.y, -1.0, 1.0))) * 50.0;
          vec3 starCol = sampleStars(suv, 0.875);
          starCol += sampleStars(suv * 1.8 + 5.5, 0.925) * 0.48;

          float edgeDist = length(uv);
          float edgeFade = smoothstep(1.55, 0.5, edgeDist);
          starCol *= mix(0.4, 1.0, edgeFade);

          float outside = step(1.5, minR) * (1.0 - alpha);
          col += starCol * outside * 1.2;
          float a = max(alpha, smoothstep(0.01, 0.12, length(col)));
          a = max(a, outside * smoothstep(0.004, 0.04, length(starCol)));

          gl_FragColor = vec4(col, max(a, outside * smoothstep(0.005, 0.06, length(starCol))));
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
