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

          // Event horizon shadow
          float horizon = length(uv * vec2(1.0, 1.35));
          float shadow = smoothstep(0.22, 0.28, horizon);

          // Main equatorial disk
          float diskY = abs(y);
          float inDisk = smoothstep(0.08, 0.0, diskY) * smoothstep(1.6, 0.3, abs(x));
          float rMain = length(vec2(x, y * 3.5));
          float mainFlow = rings(rMain, atan(y, x));
          float mainMask = inDisk * smoothstep(0.25, 0.4, rMain) * smoothstep(1.7, 1.2, abs(x));

          // Upper lensed arc (far side bent over the top)
          float arcCenterY = 0.42;
          float arcR = length(vec2(x * 0.85, (y - arcCenterY) * 1.1));
          float upperArc = smoothstep(0.55, 0.35, arcR) * smoothstep(0.15, 0.32, arcR);
          upperArc *= smoothstep(-0.1, 0.15, y);
          float upperFlow = rings(arcR, atan(y - arcCenterY, x));

          // Lower secondary image
          float lowCenterY = -0.38;
          float lowR = length(vec2(x * 1.1, (y - lowCenterY) * 1.3));
          float lowerArc = smoothstep(0.32, 0.18, lowR) * smoothstep(0.06, 0.16, lowR);
          lowerArc *= smoothstep(0.05, -0.1, y);
          float lowerFlow = rings(lowR, atan(y - lowCenterY, x));

          // Photon ring
          float pr = abs(horizon - 0.3);
          float photon = exp(-pr * pr * 180.0) * 1.4;

          // Colors — orange-red like the reference
          vec3 hot = vec3(1.0, 0.75, 0.25);
          vec3 mid = vec3(1.0, 0.35, 0.05);
          vec3 cool = vec3(0.7, 0.08, 0.02);

          vec3 col = vec3(0.0);

          // Main disk
          float mainI = mainMask * (0.4 + mainFlow * 0.8);
          col += mix(cool, hot, mainFlow) * mainI;

          // Upper arc
          float upI = upperArc * (0.35 + upperFlow * 0.9);
          col += mix(mid, hot, upperFlow) * upI;

          // Lower arc
          float lowI = lowerArc * (0.3 + lowerFlow * 0.7);
          col += mix(cool, mid, lowerFlow) * lowI * 0.85;

          // Photon ring
          col += vec3(1.0, 0.7, 0.3) * photon * shadow;

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
