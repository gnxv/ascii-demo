'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function AsciiBlackHole() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x010204)
    scene.fog = new THREE.FogExp2(0x010204, 0.012)

    const camera = new THREE.PerspectiveCamera(
      38,
      container.clientWidth / container.clientHeight,
      0.1,
      60
    )
    camera.position.set(0, 5.5, 14)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    // Soft ambient
    scene.add(new THREE.AmbientLight(0x111122, 0.4))

    // Event horizon — pure black
    const horizon = new THREE.Mesh(
      new THREE.SphereGeometry(1.0, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    )
    scene.add(horizon)

    // Photon ring (thin bright)
    const photonGeo = new THREE.RingGeometry(1.08, 1.18, 128)
    const photonMat = new THREE.ShaderMaterial({
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
        void main() {
          float d = abs(vUv.y - 0.5) * 2.0;
          float soft = exp(-d * d * 12.0);
          float pulse = 0.75 + 0.25 * sin(uTime * 2.2);
          vec3 col = vec3(1.0, 0.94, 0.75) * soft * pulse;
          gl_FragColor = vec4(col, soft * 0.8);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    const photon = new THREE.Mesh(photonGeo, photonMat)
    photon.rotation.x = -Math.PI / 2.6
    scene.add(photon)

    // Main accretion disk — better shader
    const diskGeo = new THREE.RingGeometry(1.45, 7.2, 128, 16)
    const diskMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        varying vec3 vPos;
        varying float vR;
        void main() {
          vUv = uv;
          vec3 pos = position;
          float r = length(pos.xy);
          vR = r;
          // gentle vertical warp for depth
          pos.z += sin(atan(pos.y, pos.x) * 2.0 + r * 0.4) * 0.08 * smoothstep(1.5, 4.0, r);
          vPos = pos;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vPos;
        varying float vR;

        void main() {
          float r = vR;
          float ang = atan(vPos.y, vPos.x);
          float spin = uTime * 0.85;

          // Keplerian-ish brightness + Doppler
          float doppler = 0.55 + 0.45 * sin(ang + spin * 1.6);
          float turbulence = 0.7 + 0.3 * sin(r * 6.5 - spin * 3.2 + ang * 4.0);
          turbulence *= 0.85 + 0.15 * sin(r * 14.0 - spin * 5.0);

          // Temperature gradient
          vec3 hot = vec3(1.0, 0.97, 0.85);
          vec3 mid = vec3(1.0, 0.55, 0.15);
          vec3 cool = vec3(0.7, 0.12, 0.04);
          vec3 col = mix(hot, mid, smoothstep(1.6, 3.4, r));
          col = mix(col, cool, smoothstep(3.2, 6.5, r));

          float innerFade = smoothstep(1.4, 1.9, r);
          float outerFade = smoothstep(7.2, 5.4, r);
          float alpha = innerFade * outerFade * doppler * turbulence;

          // brighter approaching side
          col *= 0.55 + doppler * 0.9;

          gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.92));
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    const disk = new THREE.Mesh(diskGeo, diskMat)
    disk.rotation.x = -Math.PI / 2.55
    scene.add(disk)

    // Secondary outer faint disk
    const outerGeo = new THREE.RingGeometry(5.5, 9.5, 64, 4)
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0x441100,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    const outerDisk = new THREE.Mesh(outerGeo, outerMat)
    outerDisk.rotation.x = -Math.PI / 2.55
    scene.add(outerDisk)

    // Jets — thinner, brighter core
    function makeJet(up: boolean) {
      // Narrow near the black hole, wider far away, soft edges
      const geo = new THREE.CylinderGeometry(0.85, 0.03, 7.0, 32, 1, true)
      const mat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: /* glsl */ `
          varying vec3 vPos;
          void main() {
            vPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          varying vec3 vPos;
          void main() {
            float y = vPos.y;
            float radial = length(vPos.xz);
            // Soft gaussian falloff from axis
            float soft = exp(-pow(radial * 3.5, 2.0));
            // Fade along length
            float along = smoothstep(3.5, 0.4, abs(y));
            float pulse = 0.7 + 0.3 * sin(uTime * 2.2 + y * 1.1);
            vec3 core = vec3(1.0, 0.96, 0.8);
            vec3 outer = vec3(0.3, 0.55, 1.0);
            vec3 col = mix(outer, core, soft) * pulse;
            gl_FragColor = vec4(col, soft * along * 0.75);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.y = up ? 3.8 : -3.8
      if (!up) mesh.rotation.x = Math.PI
      scene.add(mesh)
      return { mesh, mat }
    }

    const jetUp = makeJet(true)
    const jetDown = makeJet(false)

    // Corona / glow around horizon
    const coronaGeo = new THREE.SphereGeometry(1.35, 32, 32)
    const coronaMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: /* glsl */ `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        varying vec3 vNormal;
        void main() {
          float fres = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.2);
          float pulse = 0.7 + 0.3 * sin(uTime * 1.5);
          vec3 col = vec3(1.0, 0.75, 0.35) * fres * pulse;
          gl_FragColor = vec4(col, fres * 0.55);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    })
    const corona = new THREE.Mesh(coronaGeo, coronaMat)
    scene.add(corona)

    // Infalling sparks
    const N = 120
    const sparks: { a: number; r: number; spd: number; y: number; life: number }[] = []
    const positions = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      sparks.push({
        a: Math.random() * Math.PI * 2,
        r: 1.8 + Math.random() * 4.5,
        spd: 0.6 + Math.random() * 1.2,
        y: (Math.random() - 0.5) * 0.4,
        life: Math.random(),
      })
    }
    const sparkGeo = new THREE.BufferGeometry()
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const sparkMat = new THREE.PointsMaterial({
      color: 0xffddaa,
      size: 0.045,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const sparkPoints = new THREE.Points(sparkGeo, sparkMat)
    scene.add(sparkPoints)

    let time = 0
    let animId: number

    const animate = () => {
      animId = requestAnimationFrame(animate)
      time += 0.016

      diskMat.uniforms.uTime.value = time
      photonMat.uniforms.uTime.value = time
      coronaMat.uniforms.uTime.value = time
      jetUp.mat.uniforms.uTime.value = time
      jetDown.mat.uniforms.uTime.value = time

      disk.rotation.z = time * 0.12
      photon.rotation.z = time * 0.35
      outerDisk.rotation.z = time * 0.06

      for (let i = 0; i < N; i++) {
        const s = sparks[i]
        s.a += s.spd * 0.018
        s.r -= 0.012 * s.spd
        if (s.r < 1.2) {
          s.r = 2.0 + Math.random() * 4.8
          s.a = Math.random() * Math.PI * 2
          s.y = (Math.random() - 0.5) * 0.35
        }
        positions[i * 3] = Math.cos(s.a) * s.r
        positions[i * 3 + 1] = s.y
        positions[i * 3 + 2] = Math.sin(s.a) * s.r * 0.28
      }
      sparkGeo.attributes.position.needsUpdate = true

      camera.position.x = Math.sin(time * 0.05) * 1.4
      camera.position.y = 5.2 + Math.sin(time * 0.03) * 0.4
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
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      horizon.geometry.dispose()
      ;(horizon.material as THREE.Material).dispose()
      photonGeo.dispose()
      photonMat.dispose()
      diskGeo.dispose()
      diskMat.dispose()
      outerGeo.dispose()
      outerMat.dispose()
      coronaGeo.dispose()
      coronaMat.dispose()
      sparkGeo.dispose()
      sparkMat.dispose()
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
        background: '#010204',
      }}
    />
  )
}
