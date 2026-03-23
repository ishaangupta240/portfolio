import { useEffect, useRef } from 'react'
import { dockApps } from '#constants'
import React from 'react'
import { Tooltip } from 'react-tooltip'
import { gsap } from 'gsap'
import uiConfig from '../config/ui.json'
import { useWindowStore } from '#store/window'

const Dock = () => {
  const dockRef = useRef(null)
  const {openWindow, closeWindow, windows} = useWindowStore()
  const iconRefs = useRef([])
  const dockStyle = uiConfig.dockStyle === 'normal' ? 'normal' : 'liquid'
  const isLiquidDock = dockStyle === 'liquid'

  const toggleApp = (app) => {
    if(!app.canOpen) return
    const win = windows[app.id]
    if (!win) return

    const nextOpenState = !win.isOpen
    if(win.isOpen) {
      closeWindow(app.id)
    } else {
      openWindow(app.id)
    }

    console.log(`Toggled ${app.name}: now ${nextOpenState ? 'open' : 'closed'}`)
  }

  useEffect(() => {
    const dockEl = dockRef.current
    if (!dockEl) return

    const iconAnimators = iconRefs.current
      .filter(Boolean)
      .map((icon) => ({
        icon,
        toScaleX: gsap.quickTo(icon, 'scaleX', { duration: 0.14, ease: 'power2.out' }),
        toScaleY: gsap.quickTo(icon, 'scaleY', { duration: 0.14, ease: 'power2.out' }),
        toLift: gsap.quickTo(icon, 'y', { duration: 0.14, ease: 'power2.out' }),
      }))

    iconAnimators.forEach(({ icon }) => {
      gsap.set(icon, {
        y: 0,
        scaleX: 1,
        scaleY: 1,
        transformOrigin: 'center bottom',
        force3D: true,
      })
    })

    let rafId = null
    let pointerX = 0
    let pointerY = 0
    let dockRect = dockEl.getBoundingClientRect()
    let iconCenters = []

    const recalcDockRect = () => {
      dockRect = dockEl.getBoundingClientRect()
      iconCenters = iconAnimators.map(({ icon }) => {
        const rect = icon.getBoundingClientRect()
        return rect.left + rect.width / 2
      })
    }

    const resetDock = () => {
      iconAnimators.forEach(({ toScaleX, toScaleY, toLift }) => {
        toScaleX(1)
        toScaleY(1)
        toLift(0)
      })
    }

    const updateDock = () => {
      rafId = null
      const dockCenterY = dockRect.top + dockRect.height / 2
      const verticalDistance = Math.abs(pointerY - dockCenterY)
      const verticalFactor = Math.max(0.4, 1 - verticalDistance / 260)

      iconAnimators.forEach(({ icon, toScaleX, toScaleY, toLift }, index) => {
        const centerX = iconCenters[index] ?? (dockRect.left + icon.offsetLeft + icon.offsetWidth / 2)
        const distance = Math.abs(pointerX - centerX)
        const sigma = 50
        const gaussian = Math.exp(-(distance * distance) / (2 * sigma * sigma))
        const influence = gaussian * verticalFactor

        const isDisabled = icon.disabled
        const maxScale = isDisabled ? 1.06 : 1.32
        const maxLift = isDisabled ? 2 : 15

        const scale = 1 + influence * (maxScale - 1)
        const lift = influence * maxLift

        toScaleX(scale)
        toScaleY(scale)
        toLift(-lift)
      })
    }

    const onPointerEnter = (event) => {
      recalcDockRect()
      pointerX = event.clientX
      pointerY = event.clientY
      if (!rafId) rafId = requestAnimationFrame(updateDock)
    }

    const onPointerMove = (event) => {
      pointerX = event.clientX
      pointerY = event.clientY
      if (!rafId) rafId = requestAnimationFrame(updateDock)
    }

    const onPointerLeave = () => {
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      resetDock()
    }

    const onResize = () => {
      recalcDockRect()
    }

    dockEl.addEventListener('pointerenter', onPointerEnter)
    dockEl.addEventListener('pointermove', onPointerMove)
    dockEl.addEventListener('pointerleave', onPointerLeave)
    window.addEventListener('resize', onResize)

    return () => {
      dockEl.removeEventListener('pointerenter', onPointerEnter)
      dockEl.removeEventListener('pointermove', onPointerMove)
      dockEl.removeEventListener('pointerleave', onPointerLeave)
      window.removeEventListener('resize', onResize)
      if (rafId) cancelAnimationFrame(rafId)
      resetDock()
    }
  }, [])

  const topRunningZ = dockApps.reduce((maxZ, app) => {
    const z = windows[app.id]?.isOpen ? windows[app.id]?.zIndex ?? -1 : -1
    return Math.max(maxZ, z)
  }, -1)

  return (
    <section id="dock">
      <div ref={dockRef} className={`dock-container ${isLiquidDock ? 'liquid-glass-static dock-liquid' : 'dock-normal-glass'}`}>
        {dockApps.map(({ id, name, icon, canOpen }, index) => {
            const win = windows[id]
            const isOpen = win?.isOpen ?? false
          const isRunning = win?.isRunning ?? false
            const isActive = isOpen && (win?.zIndex ?? -1) === topRunningZ
            return (
            <div key={id} className={`dock-item ${!canOpen ? 'is-disabled' : isRunning ? 'is-running' : ''} ${isActive ? 'is-active' : ''}`}>
                    <button 
                    type='button' 
                    className={`dock-icon ${isLiquidDock ? 'liquid-glass' : ''}`} 
                    ref={(el) => {
                    iconRefs.current[index] = el
                    }}
                    aria-label={name} 
                    data-tooltip-id="dock-tooltip"
                    data-tooltip-place="top"
                    data-tooltip-content={name}
                    data-tooltip-delay-show={150}
                    data-window-key={id}
                    disabled={!canOpen}
                    onClick={() => toggleApp({ id, name, canOpen })}
                    >
                        <img
                          src={`/images/${icon}`}
                          alt={`${name} icon`}
                          loading='lazy'
                          className={`dock-icon-image dock-icon-${id} ${canOpen ? '' : 'opacity-60'}`}
                        />
                    </button>
                    <span className='running-dot' aria-hidden='true' />
                </div>
            )
        })}
        <Tooltip id="dock-tooltip" place='top' offset={10} positionStrategy='fixed' className='tooltip' />
      </div>
    </section>
  )
}

export default Dock
