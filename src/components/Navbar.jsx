import dayjs from "dayjs";
import { gsap } from 'gsap'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { navIcons, navLinks } from '#constants';
import { useWindowStore } from '#store/window';

const THEME_STORAGE_KEY = 'portfolio-theme-mode'
const CONTROL_PANEL_TRANSITION_MS = 170

const SF_SYMBOL_CODEPOINTS = {
  // existing
  voice: 0x10066b,
  network: 0x100647,
  airdrop: 0x100462,
  appleCast: 0x100461,
  airplane: 0x100453,
  bluetooth: 0x10057f,
  shazam: 0x101121,

  // 👍 reactions
  hand: 0x10027e,
  thumbsUp: 0x10027f,
  thumbsUpFill: 0x100280,
  thumbsDown: 0x100281,
  thumbsDownFill: 0x100282,

  // ▶️ media controls
  play: 0x100283,
  playFill: 0x100284,
  pause: 0x100285,
  pauseFill: 0x100286,
  playPause: 0x100287,
  playPauseFill: 0x100288,
  backward: 0x100289,
  vold:0x1002a1,
  volu:0x1002a9,
  brightu:0x1001ae,
  brightd:0x1001ac,

  // ⏮ ⏭ navigation
  backwardFill: 0x10028a,
  forward: 0x10028b,
  forwardFill: 0x10028c,

  // ⏪ ⏩ skip
  skipBack: 0x10028d,
  skipBackFill: 0x10028e,
  skipForward: 0x10028f,
  skipForwardFill: 0x100290,

  // ⏮⏮ / ⏭⏭ variants
  rewindDouble: 0x100291,
  rewindDoubleFill: 0x100292,
  fastForwardDouble: 0x100293,
  fastForwardDoubleFill: 0x100294,

  // ▶️ circle
  playCircle: 0x100295,

  moon: 0x263e,
  focus: 0x263e,
}

const getSymbolGlyph = (codePoint, fallback) => {
  try {
    return String.fromCodePoint(codePoint)
  } catch {
    return fallback
  }
}

const CONTROL_CENTER_GLYPHS = {
  network: getSymbolGlyph(SF_SYMBOL_CODEPOINTS.network, '📶'),
  voice: getSymbolGlyph(SF_SYMBOL_CODEPOINTS.voice, '◉'),
  airdrop: getSymbolGlyph(SF_SYMBOL_CODEPOINTS.airdrop, '◎'),
  appleCast: getSymbolGlyph(SF_SYMBOL_CODEPOINTS.appleCast, '▢'),
  airplane: getSymbolGlyph(SF_SYMBOL_CODEPOINTS.airplane, '✈'),

  wifi: getSymbolGlyph(SF_SYMBOL_CODEPOINTS.network, '📶'),
  bluetooth: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em" style={{ transform: 'scale(1.2)' }}>
      <path d="M11.2501 21.65V13.8l-4.85 4.85 -1.05 -1.05 5.6 -5.6 -5.6 -5.6 1.05 -1.05 4.85 4.85V2.349975h0.75L17.3501 7.7l-4.3 4.3 4.3 4.3 -5.35 5.35h-0.75Zm1.5 -11.45 2.5 -2.5 -2.5 -2.45v4.95Zm0 8.55 2.5 -2.45 -2.5 -2.5v4.95Z"></path>
    </svg>
  ),
  shazam: getSymbolGlyph(SF_SYMBOL_CODEPOINTS.shazam, 'S'),

  // media
  play: getSymbolGlyph(SF_SYMBOL_CODEPOINTS.playFill, '▶'),
  pause: getSymbolGlyph(SF_SYMBOL_CODEPOINTS.pauseFill, '⏸'),
  next: getSymbolGlyph(SF_SYMBOL_CODEPOINTS.skipForwardFill, '⏭'),
  back: getSymbolGlyph(SF_SYMBOL_CODEPOINTS.skipBackFill, '⏮'),

  // extras
  playCircle: getSymbolGlyph(SF_SYMBOL_CODEPOINTS.playCircle, '▶'),
  display: '🖥',
  stageManager: '❖',

  // fallback system
  moon: getSymbolGlyph(SF_SYMBOL_CODEPOINTS.moon, '🌙'),
  focus: getSymbolGlyph(SF_SYMBOL_CODEPOINTS.focus, '🔆'),
  vold: getSymbolGlyph(SF_SYMBOL_CODEPOINTS.vold, '🔈'),
  volu: getSymbolGlyph(SF_SYMBOL_CODEPOINTS.volu, '🔊'),
  brightd: getSymbolGlyph(SF_SYMBOL_CODEPOINTS.brightd, '🔅'),
  brightu: getSymbolGlyph(SF_SYMBOL_CODEPOINTS.brightu, '🔆'),
  sun: '☀',
  controls: '☰',
  volumeLow: '◁',
  volumeHigh: '▷',
}

const getInitialThemeMode = () => {
  if (typeof window === 'undefined') return 'light'

  const storedMode = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (storedMode === 'light' || storedMode === 'dark') {
    return storedMode
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const Navbar = () => {
  const { openWindow, closeWindow, windows } = useWindowStore()
  const [now, setNow] = useState(dayjs())
  const [isControlPanelOpen, setIsControlPanelOpen] = useState(false)
  const [isControlPanelMounted, setIsControlPanelMounted] = useState(false)
  const [themeMode, setThemeMode] = useState(getInitialThemeMode)
  const [displayLevel, setDisplayLevel] = useState(78)
  const [volumeLevel, setVolumeLevel] = useState(64)
  const [controlToggles, setControlToggles] = useState({
    wifi: true,
    bluetooth: true,
    airdrop: false,
    airplane: false,
    cast: false,
  })
  const controlPanelRef = useRef(null)
  const controlPanelButtonRef = useRef(null)
  const closeControlPanelTimerRef = useRef(null)

  const openControlPanel = useCallback(() => {
    if (closeControlPanelTimerRef.current) {
      window.clearTimeout(closeControlPanelTimerRef.current)
      closeControlPanelTimerRef.current = null
    }

    setIsControlPanelMounted(true)
    setIsControlPanelOpen(true)
  }, [])

  const closeControlPanel = useCallback(() => {
    setIsControlPanelOpen(false)
  }, [])

  const toggleControlPanel = useCallback(() => {
    if (isControlPanelOpen) {
      closeControlPanel()
      return
    }

    openControlPanel()
  }, [closeControlPanel, isControlPanelOpen, openControlPanel])

  useEffect(() => {
    if (isControlPanelOpen) {
      setIsControlPanelMounted(true)
      if (closeControlPanelTimerRef.current) {
        window.clearTimeout(closeControlPanelTimerRef.current)
        closeControlPanelTimerRef.current = null
      }
      return undefined
    }

    if (!isControlPanelMounted) return undefined

    closeControlPanelTimerRef.current = window.setTimeout(() => {
      setIsControlPanelMounted(false)
      closeControlPanelTimerRef.current = null
    }, CONTROL_PANEL_TRANSITION_MS)

    return () => {
      if (closeControlPanelTimerRef.current) {
        window.clearTimeout(closeControlPanelTimerRef.current)
        closeControlPanelTimerRef.current = null
      }
    }
  }, [isControlPanelMounted, isControlPanelOpen])

  const toggleThemeMode = useCallback(() => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const toggleControl = useCallback((key) => {
    setControlToggles((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }, [])

  const isDarkTheme = themeMode === 'dark'

  useEffect(() => {
    const tick = setInterval(() => setNow(dayjs()), 1000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.themeMode = themeMode
    document.documentElement.dataset.theme = themeMode
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode)
  }, [themeMode])

  useEffect(() => {
    if (!isControlPanelOpen) return undefined

    const handlePointerDown = (event) => {
      const panel = controlPanelRef.current
      const trigger = controlPanelButtonRef.current
      const target = event.target

      if (panel?.contains(target) || trigger?.contains(target)) return
      closeControlPanel()
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeControlPanel()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeControlPanel, isControlPanelOpen])

  useEffect(() => {
    return () => {
      if (closeControlPanelTimerRef.current) {
        window.clearTimeout(closeControlPanelTimerRef.current)
        closeControlPanelTimerRef.current = null
      }
    }
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

      const glassThickness = 80
      const ior = 3.0
      const scaleRatio = 1.0
      const blurAmt = 0.3
      const specOpacity = 0.5
      const specSat = 4
      const heightFn = SURFACE_FNS.convex_squircle

      const cache = new Map()
      const filterStrs = []

      targets.forEach((el) => {
        const rect = el.getBoundingClientRect()
        const w = Math.ceil(rect.width)
        const h = Math.ceil(rect.height)
        if (w < 2 || h < 2) return

        let r = parseFloat(getComputedStyle(el).borderRadius)
        if (Number.isNaN(r)) r = 10

        const key = `${w}x${h}x${r}`
        
        let filterId = cache.get(key)
        if (!filterId) {
          filterId = `lq-flt-${cache.size}`
          cache.set(key, filterId)

          const bezelW = Math.max(1, Math.min(22, r - 1, Math.min(w, h) / 2 - 1))

          const profile = calculateRefractionProfile(glassThickness, bezelW, heightFn, ior, 128)
          const maxDisp = Math.max(...Array.from(profile).map(Math.abs)) || 1
          const dispUrl = generateDisplacementMap(w, h, r, bezelW, profile, maxDisp)
          const specUrl = generateSpecularMap(w, h, r, bezelW * 2.5)
          const scale = maxDisp * scaleRatio

          filterStrs.push(`
            <filter id="${filterId}" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB">
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
          `)
        }
        
        el.style.setProperty('--lg-filter', `url(#${filterId})`)
      })

      defs.innerHTML = filterStrs.join('')
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
    <nav id="menu-bar" className={isControlPanelOpen ? 'is-control-panel-open' : ''}>
    <div className='menu-left'>
                <button className='menu-apple-btn liquid-glass' aria-label='Apple menu'>
                    <img src="/images/logo.svg" alt="Apple logo" className='apple-logo' />
                </button>
        <p className='menu-title'>Ishaan's Portfolio</p>

        <ul className='menu-links'>
            {navLinks.map(({id, name, type}) => (
                <li
                  key={id}
                  onClick={() => {
                    const isOpen = !!windows[type]?.isOpen
                    if (isOpen) {
                      closeWindow(type)
                    } else {
                      openWindow(type)
                    }
                  }}
                >
              <p className='menu-link liquid-glass'>
                <span className='menu-link-label'>{name}</span>
              </p>
                </li>
            ))}
        </ul>
    </div>

    <div className='menu-right'>
        <ul className='menu-icons'>
            {navIcons.map(({id, img}) => {
                const isControlCenter = id === 4
                const iconClassName = `menu-icon-btn liquid-glass ${isControlCenter ? 'is-control-center' : ''} ${isControlCenter && isControlPanelOpen ? 'is-active' : ''}`

                return (
                  <li key={id} className='menu-icon-item'>
                    {isControlCenter ? (
                      <button
                        type='button'
                        className={iconClassName}
                        onClick={toggleControlPanel}
                        aria-label={isControlPanelOpen ? 'Close control panel' : 'Open control panel'}
                        aria-haspopup='dialog'
                        aria-expanded={isControlPanelOpen}
                        ref={controlPanelButtonRef}
                      >
                        <img src={img} className="icon" alt='Control center' />
                      </button>
                    ) : (
                      <span
                        className={iconClassName}
                        role='img'
                        aria-hidden='true'
                        tabIndex={-1}
                      >
                        <img src={img} className="icon" alt='' aria-hidden='true' />
                      </span>
                    )}

                    {isControlCenter && isControlPanelMounted && (
                      <div
                        className={`control-center-panel ${isControlPanelOpen ? 'is-open' : 'is-closing'}`}
                        role='dialog'
                        aria-label='Control panel'
                        aria-hidden={!isControlPanelOpen}
                        ref={controlPanelRef}
                      >
                        <div className='cc-main-grid'>
                          <div className='cc-col-left'>
                            <div className='cc-connectivity-stack'>
                              <button
                                type='button'
                                className={`cc-connectivity-pill ${controlToggles.wifi ? 'is-active' : ''}`}
                                onClick={() => toggleControl('wifi')}
                                aria-pressed={controlToggles.wifi}
                                aria-label='Toggle Wi-Fi'
                              >
                                <span className='cc-pill-icon' aria-hidden='true'>
                                  <span className='cc-symbol'>{CONTROL_CENTER_GLYPHS.network}</span>
                                </span>
                                <span className='cc-pill-copy'>
                                  <span className='cc-pill-title'>Wi-Fi</span>
                                  <span className='cc-pill-subtitle'>{controlToggles.wifi ? 'Ishaan' : 'Off'}</span>
                                  {controlToggles.wifi && <span className='cc-pill-meta'></span>}
                                </span>
                              </button>
                              <button
                                type='button'
                                className={`cc-connectivity-pill ${controlToggles.bluetooth ? 'is-active' : ''}`}
                                onClick={() => toggleControl('bluetooth')}
                                aria-pressed={controlToggles.bluetooth}
                                aria-label='Toggle Bluetooth'
                              >
                                <span className='cc-pill-icon' aria-hidden='true'>
                                  <span className='cc-symbol'>{CONTROL_CENTER_GLYPHS.bluetooth}</span>
                                </span>
                                <span className='cc-pill-copy'>
                                  <span className='cc-pill-title'>Bluetooth</span>
                                  <span className='cc-pill-subtitle'>{controlToggles.bluetooth ? 'On' : 'Off'}</span>
                                </span>
                              </button>
                              <button
                                type='button'
                                className={`cc-connectivity-pill ${controlToggles.airdrop ? 'is-active' : ''}`}
                                onClick={() => toggleControl('airdrop')}
                                aria-pressed={controlToggles.airdrop}
                                aria-label='Toggle AirDrop'
                              >
                                <span className='cc-pill-icon' aria-hidden='true'>
                                  <span className='cc-symbol'>{CONTROL_CENTER_GLYPHS.airdrop}</span>
                                </span>
                                <span className='cc-pill-copy'>
                                  <span className='cc-pill-title'>AirDrop</span>
                                  <span className='cc-pill-subtitle'>{controlToggles.airdrop ? 'Everyone' : 'Off'}</span>
                                </span>
                              </button>
                            </div>
                          </div>

                          <div className='cc-col-right'>
                            <div className='cc-tile cc-media-tile'>
                              <div className='cc-media-head'>
                                <img src="/images/safari.png" className='cc-media-art' aria-hidden='true' alt='' />
                                <div className='cc-media-copy'>
                                  <p>Netflix</p>
                                </div>
                              </div>
                              <div className='cc-media-controls'>
                                <button type='button' aria-label='Previous track'>
                                  <span className='cc-symbol' aria-hidden='true'>{CONTROL_CENTER_GLYPHS.back}</span>
                                </button>
                                <button type='button' aria-label='Play track'>
                                  <span className='cc-symbol' aria-hidden='true'>{CONTROL_CENTER_GLYPHS.play}</span>
                                </button>
                                <button type='button' aria-label='Next track'>
                                  <span className='cc-symbol' aria-hidden='true'>{CONTROL_CENTER_GLYPHS.next}</span>
                                </button>
                              </div>
                            </div>
                            
                            <button type='button' className={`cc-action-pill ${isDarkTheme ? 'is-active' : ''}`} onClick={toggleThemeMode}>
                              <span className='cc-pill-icon' aria-hidden='true'>
                                <span className='cc-symbol'>{CONTROL_CENTER_GLYPHS.moon}</span>
                              </span>
                              <span className='cc-pill-copy'>
                                <span className='cc-pill-title'>Dark</span>
                                <span className='cc-pill-subtitle'>{isDarkTheme ? 'On' : 'Off'}</span>
                              </span>
                            </button>
                          </div>
                        </div>

                        <div className='cc-slider-stack'>
                          <div className='cc-slider-card'>
                            <div className='cc-slider-row'>
                              <span className='cc-slider-label'>Display</span>
                              <span className='cc-symbol cc-slider-edge' aria-hidden='true'>{CONTROL_CENTER_GLYPHS.brightd}</span>
                              <input
                                type='range'
                                min='0'
                                max='100'
                                value={displayLevel}
                                onChange={(event) => setDisplayLevel(Number(event.target.value))}
                                aria-label='Display brightness'
                              />
                              <span className='cc-symbol cc-slider-edge' aria-hidden='true'>{CONTROL_CENTER_GLYPHS.brightu}</span>
                            </div>
                          </div>

                          <div className='cc-slider-card'>
                            <div className='cc-slider-row'>
                              <span className='cc-slider-label'>Sound</span>
                              <div className='cc-slider-wrapper'>
                                <span className='cc-symbol cc-slider-edge' aria-hidden='true'>{CONTROL_CENTER_GLYPHS.vold}</span>
                                <input
                                  type='range'
                                  min='0'
                                  max='100'
                                  value={volumeLevel}
                                  onChange={(event) => setVolumeLevel(Number(event.target.value))}
                                  aria-label='Sound volume'
                                />
                                <span className='cc-symbol cc-slider-edge' aria-hidden='true'>{CONTROL_CENTER_GLYPHS.volu}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className='cc-bottom-actions'>
                          <button type='button' className='cc-action-btn cc-round-btn'>
                            <span className='cc-symbol'>{CONTROL_CENTER_GLYPHS.moon}</span>
                          </button>
                          <button type='button' className='cc-action-btn cc-round-btn'>
                            <span className='cc-symbol'>{CONTROL_CENTER_GLYPHS.appleCast}</span>
                          </button>
                          <button type='button' className='cc-action-btn cc-round-btn'>
                            <span className='cc-symbol'>{CONTROL_CENTER_GLYPHS.shazam}</span>
                          </button>
                        </div>
                        
                        <div className='cc-edit-controls'>
                          <button type='button' className='cc-edit-btn'>Edit Controls</button>
                        </div>
                      </div>
                    )}
                  </li>
                )
            })}
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