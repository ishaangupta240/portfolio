import dayjs from "dayjs";
import { gsap } from 'gsap'

import React, { useEffect, useState } from 'react'
import { navIcons, navLinks } from '#constants';

const Navbar = () => {
  const [now, setNow] = useState(dayjs())

  useEffect(() => {
    const tick = setInterval(() => setNow(dayjs()), 1000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    const defs = document.getElementById('svg-defs')
    if (!defs) return

    const SURFACE_FNS = {
      convex_squircle: (x) => Math.pow(1 - Math.pow(1 - x, 4), 0.25),
    }

    const calculateRefractionProfile = (glassThickness, bezelWidth, heightFn, ior, samples = 128) => {
      const eta = 1 / ior
      const refract = (nx, ny) => {
        const dot = ny
        const k = 1 - eta * eta * (1 - dot * dot)
        if (k < 0) return null
        const sq = Math.sqrt(k)
        return [-(eta * dot + sq) * nx, eta - (eta * dot + sq) * ny]
      }

      const profile = new Float64Array(samples)
      for (let i = 0; i < samples; i++) {
        const x = i / samples
        const y = heightFn(x)
        const dx = x < 1 ? 0.0001 : -0.0001
        const y2 = heightFn(x + dx)
        const deriv = (y2 - y) / dx
        const mag = Math.sqrt(deriv * deriv + 1)
        const ref = refract(-deriv / mag, -1 / mag)
        if (!ref) {
          profile[i] = 0
          continue
        }
        profile[i] = ref[0] * ((y * bezelWidth + glassThickness) / ref[1])
      }
      return profile
    }

    const generateDisplacementMap = (w, h, radius, bezelWidth, profile, maxDisp) => {
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      const ctx = c.getContext('2d')
      if (!ctx) return ''
      const img = ctx.createImageData(w, h)
      const d = img.data

      for (let i = 0; i < d.length; i += 4) {
        d[i] = 128
        d[i + 1] = 128
        d[i + 2] = 0
        d[i + 3] = 255
      }

      const r = radius
      const rSq = r * r
      const r1Sq = (r + 1) * (r + 1)
      const rBSq = Math.max(r - bezelWidth, 0) * Math.max(r - bezelWidth, 0)
      const wB = w - r * 2
      const hB = h - r * 2
      const S = profile.length

      for (let y1 = 0; y1 < h; y1++) {
        for (let x1 = 0; x1 < w; x1++) {
          const x = x1 < r ? x1 - r : x1 >= w - r ? x1 - r - wB : 0
          const y = y1 < r ? y1 - r : y1 >= h - r ? y1 - r - hB : 0
          const dSq = x * x + y * y
          if (dSq > r1Sq || dSq < rBSq) continue

          const dist = Math.sqrt(dSq)
          const fromSide = r - dist
          const op = dSq < rSq ? 1 : 1 - (dist - Math.sqrt(rSq)) / (Math.sqrt(r1Sq) - Math.sqrt(rSq))
          if (op <= 0 || dist === 0) continue

          const cos = x / dist
          const sin = y / dist
          const bi = Math.min(((fromSide / bezelWidth) * S) | 0, S - 1)
          const disp = profile[bi] || 0
          const dX = (-cos * disp) / maxDisp
          const dY = (-sin * disp) / maxDisp
          const idx = (y1 * w + x1) * 4

          d[idx] = (128 + dX * 127 * op + 0.5) | 0
          d[idx + 1] = (128 + dY * 127 * op + 0.5) | 0
        }
      }

      ctx.putImageData(img, 0, 0)
      return c.toDataURL()
    }

    const generateSpecularMap = (w, h, radius, bezelWidth, angle = Math.PI / 3) => {
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      const ctx = c.getContext('2d')
      if (!ctx) return ''
      const img = ctx.createImageData(w, h)
      const d = img.data
      d.fill(0)

      const r = radius
      const rSq = r * r
      const r1Sq = (r + 1) * (r + 1)
      const rBSq = Math.max(r - bezelWidth, 0) * Math.max(r - bezelWidth, 0)
      const wB = w - r * 2
      const hB = h - r * 2
      const sv = [Math.cos(angle), Math.sin(angle)]

      for (let y1 = 0; y1 < h; y1++) {
        for (let x1 = 0; x1 < w; x1++) {
          const x = x1 < r ? x1 - r : x1 >= w - r ? x1 - r - wB : 0
          const y = y1 < r ? y1 - r : y1 >= h - r ? y1 - r - hB : 0
          const dSq = x * x + y * y
          if (dSq > r1Sq || dSq < rBSq) continue

          const dist = Math.sqrt(dSq)
          const fromSide = r - dist
          const op = dSq < rSq ? 1 : 1 - (dist - Math.sqrt(rSq)) / (Math.sqrt(r1Sq) - Math.sqrt(rSq))
          if (op <= 0 || dist === 0) continue

          const cos = x / dist
          const sin = -y / dist
          const dot = Math.abs(cos * sv[0] + sin * sv[1])
          const edge = Math.sqrt(Math.max(0, 1 - (1 - fromSide) * (1 - fromSide)))
          const coeff = dot * edge
          const col = (255 * coeff) | 0
          const alpha = (col * coeff * op) | 0
          const idx = (y1 * w + x1) * 4

          d[idx] = col
          d[idx + 1] = col
          d[idx + 2] = col
          d[idx + 3] = alpha
        }
      }

      ctx.putImageData(img, 0, 0)
      return c.toDataURL()
    }

    const rebuildFilter = () => {
      const targets = Array.from(document.querySelectorAll('.liquid-glass, .liquid-glass-static'))
      if (!targets.length) return

      let w = 0
      let h = 0
      let radius = 10

      targets.forEach((el) => {
        const rect = el.getBoundingClientRect()
        w = Math.max(w, Math.ceil(rect.width))
        h = Math.max(h, Math.ceil(rect.height))
        const r = parseFloat(getComputedStyle(el).borderRadius)
        if (!Number.isNaN(r)) radius = Math.max(radius, r)
      })

      if (w < 2 || h < 2) return

      const glassThickness = 80
      const bezelW = Math.min(22, radius - 1, Math.min(w, h) / 2 - 1)
      const ior = 3.0
      const scaleRatio = 1.0
      const blurAmt = 0.3
      const specOpacity = 0.5
      const specSat = 4

      const heightFn = SURFACE_FNS.convex_squircle
      const profile = calculateRefractionProfile(glassThickness, bezelW, heightFn, ior, 128)
      const maxDisp = Math.max(...Array.from(profile).map(Math.abs)) || 1
      const dispUrl = generateDisplacementMap(w, h, radius, bezelW, profile, maxDisp)
      const specUrl = generateSpecularMap(w, h, radius, bezelW * 2.5)
      const scale = maxDisp * scaleRatio

      defs.innerHTML = `
        <filter id="liquid-glass-filter" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="${blurAmt}" result="blurred_source" />
          <feImage href="${dispUrl}" x="0" y="0" width="${w}" height="${h}" result="disp_map" />
          <feDisplacementMap in="blurred_source" in2="disp_map"
            scale="${scale}" xChannelSelector="R" yChannelSelector="G"
            result="displaced" />
          <feColorMatrix in="displaced" type="saturate" values="${specSat}" result="displaced_sat" />
          <feImage href="${specUrl}" x="0" y="0" width="${w}" height="${h}" result="spec_layer" />
          <feComposite in="displaced_sat" in2="spec_layer" operator="in" result="spec_masked" />
          <feComponentTransfer in="spec_layer" result="spec_faded">
            <feFuncA type="linear" slope="${specOpacity}" />
          </feComponentTransfer>
          <feBlend in="spec_masked" in2="displaced" mode="normal" result="with_sat" />
          <feBlend in="spec_faded" in2="with_sat" mode="normal" />
        </filter>
      `
    }

    let resizeTimer
    const onResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(rebuildFilter, 120)
    }

    requestAnimationFrame(() => requestAnimationFrame(rebuildFilter))
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      clearTimeout(resizeTimer)
    }
  }, [])

  useEffect(() => {
    const targets = Array.from(
      document.querySelectorAll(
        '#menu-bar .menu-link, #menu-bar .menu-icon-btn, #menu-bar .menu-apple-btn, #menu-bar .menu-time'
      )
    )

    if (!targets.length) return

    targets.forEach((el) => {
      gsap.set(el, {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        force3D: true,
      })
    })

    const cleanups = targets.map((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.12, ease: 'expo.out' })
      const yTo = gsap.quickTo(el, 'y', { duration: 0.12, ease: 'expo.out' })
      const scaleXTo = gsap.quickTo(el, 'scaleX', { duration: 0.12, ease: 'expo.out' })
      const scaleYTo = gsap.quickTo(el, 'scaleY', { duration: 0.12, ease: 'expo.out' })

      const onEnter = () => {
        scaleXTo(1.032)
        scaleYTo(1.032)
        yTo(-1)
      }

      const onMove = (event) => {
        const rect = el.getBoundingClientRect()
        const px = (event.clientX - rect.left) / rect.width - 0.5
        const py = (event.clientY - rect.top) / rect.height - 0.5
        xTo(px * 2.2)
        yTo(-1 + py * 1.35)
      }

      const onLeave = () => {
        xTo(0)
        yTo(0)
        scaleXTo(1)
        scaleYTo(1)
      }

      el.addEventListener('mouseenter', onEnter)
      el.addEventListener('mousemove', onMove)
      el.addEventListener('mouseleave', onLeave)

      return () => {
        el.removeEventListener('mouseenter', onEnter)
        el.removeEventListener('mousemove', onMove)
        el.removeEventListener('mouseleave', onLeave)
      }
    })

    return () => {
      cleanups.forEach((cleanup) => cleanup())
    }
  }, [])

  return (
    <>
    <nav id="menu-bar">
    <div className='menu-left'>
                <button className='menu-apple-btn liquid-glass' aria-label='Apple menu'>
                    <img src="/images/logo.svg" alt="Apple logo" className='apple-logo' />
                </button>
        <p className='menu-title'>Ishaan's Portfolio</p>

        <ul className='menu-links'>
            {navLinks.map(({id, name}) => (
                <li key={id}>
              <p className='menu-link liquid-glass'>
                <span className='menu-link-label'>{name}</span>
              </p>
                </li>
            ))}
        </ul>
    </div>

    <div className='menu-right'>
        <ul className='menu-icons'>
            {navIcons.map(({id, img}) => (
                <li key={id} className='menu-icon-btn liquid-glass'>
                    <img src={img} className="icon" alt={`icon-${id}`} />
                </li>
            ))}
        </ul>
                <time className='menu-time liquid-glass'><span className='menu-time-label'>{now.format('ddd MMM D h:mm A')}</span></time>
    </div>
  </nav>
  <svg aria-hidden="true" focusable="false" width="0" height="0" style={{ position: 'absolute' }}>
    <defs id="svg-defs" />
  </svg>
  </>
  )
}

export default Navbar