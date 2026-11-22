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

    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.1,
      50
    )
    camera.position.set(0, 0, 12)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    // Full-screen quad with Interstellar-style disk shader
    const geo = new THREE.PlaneGeometry(18, 10)
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        varying vec2 vUv;

        // Keplerian orbital flow: angular speed ~ r^(-1.5)
        float orbitalPhase(float r, float ang) {
          float safeR = max(r, 0.15);
          float omega = 2.8 / pow(safeR, 1.5); // faster near center
          return ang - uTime * omega;
        }

        float rings(float r, float ang) {
          float phase = orbitalPhase(r, ang);
          // Spiral arms / density waves from differential rotation
          float band = sin(phase * 3.0 + r * 12.0) * 0.5 + 0.5;
          float fine = sin(phase * 7.0 + r * 22.0) * 0.5 + 0.5;
          return mix(pow(band, 1.2), fine, 0.4);
        }

        void main() {
          vec2 uv = (vUv - 0.5) * vec2(1.8, 1.0);
          float x = uv.x;
          float y = uv.y;

          // Event horizon shadow (dark center)
          float horizon = length(uv * vec2(1.0, 1.15));
          float shadow = smoothstep(0.18, 0.26, horizon);

          // --- Main equatorial disk (thin horizontal band) ---
          float diskThick = 0.045;
          float inDisk = smoothstep(diskThick, diskThick * 0.3, abs(y));
          float rDisk = abs(x);
          float diskRadial = smoothstep(0.28, 0.42, rDisk) * smoothstep(1.55, 1.15, rDisk);
          float mainMask = inDisk * diskRadial;
          float mainAng = atan(y * 2.0, x);
          float mainFlow = rings(rDisk, mainAng);

          // --- Upper lensed arc (smooth arch over the hole) ---
          // Far side of disk bent upward
          float archY = 0.38 - pow(abs(x) * 0.55, 2.0); // parabolic arch
          float archDist = abs(y - archY);
          float upperArc = smoothstep(0.12, 0.02, archDist);
          upperArc *= smoothstep(0.9, 0.3, abs(x));
          upperArc *= smoothstep(0.2, 0.35, y + 0.05); // only above center
          float upperFlow = rings(0.5 + abs(x) * 0.6, atan(y - 0.2, x));

          // --- Lower secondary (small ring under, not a fan) ---
          float lowY = -0.32;
          float lowR = length(vec2(x * 1.4, (y - lowY) * 2.2));
          float lowerRing = smoothstep(0.22, 0.12, abs(lowR - 0.18));
          lowerRing *= smoothstep(0.0, -0.08, y);
          lowerRing *= smoothstep(0.7, 0.2, abs(x));
          float lowerFlow = rings(lowR + 0.3, atan(y - lowY, x));

          // Photon ring
          float pr = abs(horizon - 0.24);
          float photon = exp(-pr * pr * 220.0);

          // Colors
          vec3 hot = vec3(1.0, 0.72, 0.22);
          vec3 mid = vec3(1.0, 0.32, 0.04);
          vec3 cool = vec3(0.65, 0.06, 0.01);

          vec3 col = vec3(0.0);

          // Main disk
          col += mix(cool, hot, mainFlow) * mainMask * (0.5 + mainFlow * 0.7);

          // Upper arch
          col += mix(mid, hot, upperFlow) * upperArc * (0.4 + upperFlow * 0.8);

          // Lower small ring
          col += mix(cool, mid, lowerFlow) * lowerRing * 0.6;

          // Photon ring
          col += vec3(1.0, 0.65, 0.25) * photon * 1.2;

          // Dark center
          col *= shadow;

          // Soft outer fade
          float fade = smoothstep(1.5, 0.9, length(uv));
          col *= fade;

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
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
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
