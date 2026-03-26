import React, { useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Draggable } from 'gsap/Draggable'
import { useWindowStore } from '#store/window'

gsap.registerPlugin(Draggable)

const SLIDE_END_FRACTION = 0.5
const TRANSLATE_START_FRACTION = 0.4
const OPEN_DURATION = 0.76
const CLOSE_DURATION = 0.62
const SHADOW_ALPHA_MAX = 0.25
const SHADOW_Y = 21.97
const SHADOW_BLUR = 43.94

const clamp01 = (value) => Math.max(0, Math.min(1, value))
const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2
const toRectSnapshot = (rect) => ({
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
})

const WindowWrapper = (Component, windowKey) => {
    const WrappedComponent = (props) => {
        const { focusWindow, closeWindow, windows } = useWindowStore()
        const win = windows[windowKey]
        const isOpen = !!win?.isOpen
        const isMaximized = !!win?.isMaximized
        const deferClose = !!win?.deferClose
        const [isVisible, setIsVisible] = useState(isOpen)
        const windowRef = useRef(null)
        const tweenRef = useRef(null)
        const fullscreenTweenRef = useRef(null)
        const frameRef = useRef(null)
        const dragRef = useRef(null)
        const lastRectRef = useRef(null)
        const restoreRectRef = useRef(null)
        const prevMaximizedRef = useRef(isMaximized)

        const getMenuCeiling = () => {
            const menuBar = document.getElementById('menu-bar')
            return menuBar ? Math.ceil(menuBar.getBoundingClientRect().bottom + 6) : 36
        }

        const getDockRect = (fallbackRect) => {
            const btn  = document.querySelector(`#dock [data-window-key="${windowKey}"]`)
            const rect = btn?.getBoundingClientRect()
            if (rect) return rect

            if (fallbackRect) {
                const centerX = fallbackRect.left + fallbackRect.width / 2
                const centerY = fallbackRect.top + fallbackRect.height / 2
                return {
                    left: centerX - 24,
                    top: centerY - 24,
                    width: 48,
                    height: 48,
                }
            }

            return {
                left: window.innerWidth / 2 - 24,
                top: window.innerHeight - 72,
                width: 48,
                height: 48,
            }
        }

        useLayoutEffect(() => {
            if (isOpen) {
                setIsVisible(true)
            }
        }, [isOpen])

        useLayoutEffect(() => {
            const el = windowRef.current

            if (!el || !isVisible || !isOpen || isMaximized) {
                dragRef.current?.kill()
                dragRef.current = null
                return
            }

            dragRef.current?.kill()

            const getDragBounds = () => {
                const topInset = getMenuCeiling()

                return {
                    left: 0,
                    top: topInset,
                    width: window.innerWidth,
                    height: Math.max(0, window.innerHeight - topInset),
                }
            }

            const trigger = el.querySelector('.window-header') || el
            const [instance] = Draggable.create(el, {
                type: 'x,y',
                trigger,
                bounds: getDragBounds(),
                edgeResistance: 0.9,
                dragResistance: 0.02,
                onPress() {
                    this.applyBounds(getDragBounds())
                    const rect = toRectSnapshot(el.getBoundingClientRect())
                    lastRectRef.current = rect
                    restoreRectRef.current = rect
                    focusWindow(windowKey)
                },
                onDrag() {
                    const rect = toRectSnapshot(el.getBoundingClientRect())
                    lastRectRef.current = rect
                    restoreRectRef.current = rect
                },
                onDragEnd() {
                    const rect = toRectSnapshot(el.getBoundingClientRect())
                    lastRectRef.current = rect
                    restoreRectRef.current = rect
                },
            })

            dragRef.current = instance

            return () => {
                dragRef.current?.kill()
                dragRef.current = null
            }
        }, [isVisible, isOpen, isMaximized, windowKey, focusWindow])

        useLayoutEffect(() => {
            const el = windowRef.current
            if (!el || !isVisible || isMaximized || fullscreenTweenRef.current) return
            const rect = toRectSnapshot(el.getBoundingClientRect())
            lastRectRef.current = rect
            restoreRectRef.current = rect
        }, [isVisible, isMaximized, win?.zIndex])

        useLayoutEffect(() => {
            const el = windowRef.current
            if (!el || !isVisible) return

            const baseRect = toRectSnapshot(el.getBoundingClientRect())

            const hasMaximizeStateChanged = prevMaximizedRef.current !== isMaximized
            const fromRect = isMaximized
                ? (restoreRectRef.current ?? lastRectRef.current)
                : (lastRectRef.current ?? restoreRectRef.current)

            if (!hasMaximizeStateChanged || !fromRect) {
                prevMaximizedRef.current = isMaximized
                lastRectRef.current = baseRect
                return
            }

            if (isMaximized && restoreRectRef.current == null) {
                restoreRectRef.current = fromRect
            }

            const targetRect = isMaximized ? baseRect : (restoreRectRef.current ?? baseRect)

            const startX = fromRect.left - baseRect.left
            const startY = fromRect.top - baseRect.top
            const startScaleX = Math.max(0.05, fromRect.width / Math.max(baseRect.width, 1))
            const startScaleY = Math.max(0.05, fromRect.height / Math.max(baseRect.height, 1))

            const endX = targetRect.left - baseRect.left
            const endY = targetRect.top - baseRect.top
            const endScaleX = Math.max(0.05, targetRect.width / Math.max(baseRect.width, 1))
            const endScaleY = Math.max(0.05, targetRect.height / Math.max(baseRect.height, 1))

            const hasMeaningfulChange =
                Math.abs(startX - endX) > 1 ||
                Math.abs(startY - endY) > 1 ||
                Math.abs(startScaleX - endScaleX) > 0.01 ||
                Math.abs(startScaleY - endScaleY) > 0.01

            if (!hasMeaningfulChange) {
                prevMaximizedRef.current = isMaximized
                lastRectRef.current = targetRect
                return
            }

            fullscreenTweenRef.current?.kill()

            gsap.set(el, {
                x: startX,
                y: startY,
                scaleX: startScaleX,
                scaleY: startScaleY,
                transformOrigin: '0% 0%',
                willChange: 'transform',
            })

            fullscreenTweenRef.current = gsap.to(el, {
                x: endX,
                y: endY,
                scaleX: endScaleX,
                scaleY: endScaleY,
                duration: isMaximized ? 0.28 : 0.3,
                ease: 'power2.out',
                onComplete: () => {
                    gsap.set(el, { clearProps: 'willChange' })
                    lastRectRef.current = targetRect
                    if (!isMaximized) {
                        restoreRectRef.current = targetRect
                    }

                    const live = useWindowStore.getState().windows[windowKey]
                    if (live?.deferClose && live?.isOpen && !live?.isMaximized) {
                        closeWindow(windowKey)
                    }
                },
            })

            prevMaximizedRef.current = isMaximized
            lastRectRef.current = targetRect

            return () => {
                fullscreenTweenRef.current?.kill()
            }
        }, [isMaximized, isVisible, windowKey, closeWindow])

        useLayoutEffect(() => {
            const el = windowRef.current
            if (!el || !isVisible) return

            tweenRef.current?.kill()

            const baseX = Number(gsap.getProperty(el, 'x')) || 0
            const baseY = Number(gsap.getProperty(el, 'y')) || 0
            const baseScaleX = Number(gsap.getProperty(el, 'scaleX')) || 1
            const baseScaleY = Number(gsap.getProperty(el, 'scaleY')) || 1
            const dockButton = document.querySelector(`#dock [data-window-key="${windowKey}"]`)
            const hasDockAnchor = !!dockButton

            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
            const openRect = el.getBoundingClientRect()
            const dockRect = getDockRect(openRect)
            const openLeft = openRect.left
            const openRight = openRect.right
            const openTop = openRect.top
            const openBottom = openRect.bottom
            const openWidth = Math.max(openRect.width, 1)
            const openHeight = Math.max(openRect.height, 1)
            const openCenterX = openRect.left + openRect.width / 2
            const openCenterY = openRect.top + openRect.height / 2

            const finalLeft = dockRect.left
            const finalRight = dockRect.left + dockRect.width
            const finalTop = dockRect.top
            const finalBottom = dockRect.top + dockRect.height

            const leftEdgeDistance = finalLeft - openLeft
            const rightEdgeDistance = finalRight - openRight
            const topVerticalDistance = finalTop - openTop
            const bottomVerticalDistance = finalBottom - openBottom

            const bezierTopY = openTop
            const bezierBottomY = finalTop
            const bezierHeight = Math.max(1, bezierBottomY - bezierTopY)

            const applyGenieFrame = (minimizeFraction, opening) => {
                const slideProgress = easeInOutSine(clamp01(minimizeFraction / SLIDE_END_FRACTION))
                const translateProgress = easeInOutSine(clamp01(
                    (minimizeFraction - TRANSLATE_START_FRACTION) / (1 - TRANSLATE_START_FRACTION)
                ))
                const openProgress = 1 - minimizeFraction

                const leftBottomX = openLeft + slideProgress * leftEdgeDistance
                const rightBottomX = openRight + slideProgress * rightEdgeDistance

                const topY = openTop + translateProgress * topVerticalDistance
                const bottomY = Math.min(openBottom + translateProgress * bottomVerticalDistance, finalBottom)

                const xAtY = (topX, bottomX, y) => {
                    if (y <= bezierTopY) return topX
                    if (y >= bezierBottomY) return bottomX
                    const progress = (y - bezierTopY) / bezierHeight
                    const eased = easeInOutQuad(progress)
                    return topX + (bottomX - topX) * eased
                }

                const topLeftX = xAtY(openLeft, leftBottomX, topY)
                const topRightX = xAtY(openRight, rightBottomX, topY)
                const bottomLeftX = xAtY(openLeft, leftBottomX, bottomY)
                const bottomRightX = xAtY(openRight, rightBottomX, bottomY)

                const topWidth = Math.max(1, topRightX - topLeftX)
                const bottomWidth = Math.max(1, bottomRightX - bottomLeftX)
                const currentWidth = (topWidth + bottomWidth) / 2
                const currentHeight = Math.max(1, bottomY - topY)

                const topCenterX = (topLeftX + topRightX) / 2
                const bottomCenterX = (bottomLeftX + bottomRightX) / 2
                const currentCenterX = (topCenterX + bottomCenterX) / 2
                const currentCenterY = (topY + bottomY) / 2

                const tl = clamp01((topLeftX - openLeft) / openWidth) * 100
                const tr = clamp01((topRightX - openLeft) / openWidth) * 100
                const bl = clamp01((bottomLeftX - openLeft) / openWidth) * 100
                const br = clamp01((bottomRightX - openLeft) / openWidth) * 100

                const nextFrame = {
                    x: currentCenterX - openCenterX,
                    y: currentCenterY - openCenterY,
                    scaleX: currentWidth / openWidth,
                    scaleY: currentHeight / openHeight,
                    opacity: (() => {
                        const baseOpacity = 1 - minimizeFraction * 0.28
                        if (!opening) return baseOpacity
                        const fadeInRamp = easeInOutSine(clamp01(openProgress / 0.24))
                        return baseOpacity * fadeInRamp
                    })(),
                    blur: minimizeFraction * 3.2,
                    shadowY: SHADOW_Y,
                    shadowBlur: SHADOW_BLUR,
                    shadowAlpha: (() => {
                        if (opening) {
                            const quickIn = easeInOutSine(clamp01(openProgress / 0.16))
                            return SHADOW_ALPHA_MAX * quickIn
                        }
                        const fadeOut = 1 - easeInOutSine(clamp01(minimizeFraction / 0.42))
                        return SHADOW_ALPHA_MAX * fadeOut
                    })(),
                    tl,
                    tr,
                    br,
                    bl,
                }

                const prev = frameRef.current
                const smooth = prev
                    ? {
                        x: prev.x + (nextFrame.x - prev.x) * 0.34,
                        y: prev.y + (nextFrame.y - prev.y) * 0.34,
                        scaleX: prev.scaleX + (nextFrame.scaleX - prev.scaleX) * 0.34,
                        scaleY: prev.scaleY + (nextFrame.scaleY - prev.scaleY) * 0.34,
                        opacity: prev.opacity + (nextFrame.opacity - prev.opacity) * 0.42,
                        blur: prev.blur + (nextFrame.blur - prev.blur) * 0.42,
                        shadowY: prev.shadowY + (nextFrame.shadowY - prev.shadowY) * 0.42,
                        shadowBlur: prev.shadowBlur + (nextFrame.shadowBlur - prev.shadowBlur) * 0.42,
                        shadowAlpha: prev.shadowAlpha + (nextFrame.shadowAlpha - prev.shadowAlpha) * 0.42,
                        tl: prev.tl + (nextFrame.tl - prev.tl) * 0.34,
                        tr: prev.tr + (nextFrame.tr - prev.tr) * 0.34,
                        br: prev.br + (nextFrame.br - prev.br) * 0.34,
                        bl: prev.bl + (nextFrame.bl - prev.bl) * 0.34,
                    }
                    : nextFrame

                frameRef.current = smooth

                gsap.set(el, {
                    x: baseX + smooth.x,
                    y: baseY + smooth.y,
                    scaleX: baseScaleX * smooth.scaleX,
                    scaleY: baseScaleY * smooth.scaleY,
                    opacity: smooth.opacity,
                    filter: `blur(${smooth.blur.toFixed(2)}px)`,
                    boxShadow: `rgba(15, 23, 42, ${smooth.shadowAlpha.toFixed(3)}) 0px ${smooth.shadowY.toFixed(2)}px ${smooth.shadowBlur.toFixed(2)}px`,
                    clipPath: `polygon(${smooth.tl}% 0%, ${smooth.tr}% 0%, ${smooth.br}% 100%, ${smooth.bl}% 100%)`,
                })
            }

            gsap.set(el, {
                transformOrigin: '50% 100%',
                willChange: 'transform,opacity,filter,clip-path',
                visibility: 'visible',
                force3D: true,
            })

            if (prefersReducedMotion) {
                if (!isOpen) setIsVisible(false)
                gsap.set(el, { clearProps: 'transform,opacity,filter,clipPath,willChange' })
                return
            }

            // Windows that don't have a matching Dock icon should not use genie motion pathing.
            if (!hasDockAnchor) {
                if (isOpen) {
                    gsap.set(el, {
                        visibility: 'visible',
                        opacity: 0,
                        scaleX: 0.98,
                        scaleY: 0.98,
                        filter: 'none',
                        clipPath: 'none',
                    })

                    tweenRef.current = gsap.to(el, {
                        opacity: 1,
                        scaleX: 1,
                        scaleY: 1,
                        duration: 0.2,
                        ease: 'power2.out',
                        onComplete: () => {
                            gsap.set(el, { clearProps: 'transform,opacity,filter,clipPath,willChange' })
                        },
                    })

                    return () => {
                        tweenRef.current?.kill()
                    }
                }

                tweenRef.current = gsap.to(el, {
                    opacity: 0,
                    scaleX: 0.98,
                    scaleY: 0.98,
                    duration: 0.16,
                    ease: 'power1.in',
                    onComplete: () => {
                        gsap.set(el, {
                            visibility: 'hidden',
                            opacity: 0,
                        })
                        dragRef.current?.kill()
                        dragRef.current = null
                        setIsVisible(false)
                    },
                })

                return () => {
                    tweenRef.current?.kill()
                    fullscreenTweenRef.current?.kill()
                }
            }

            if (isOpen) {
                const progress = { value: 1 }
                frameRef.current = null
                applyGenieFrame(1, true)
                tweenRef.current = gsap.to(progress, {
                    value: 0,
                    duration: OPEN_DURATION,
                    ease: 'sine.out',
                    onUpdate: () => {
                        applyGenieFrame(progress.value, true)
                    },
                    onComplete: () => {
                        gsap.set(el, { clearProps: 'transform,opacity,filter,clipPath,willChange' })
                    },
                })

                return () => {
                    tweenRef.current?.kill()
                }
            }

            const progress = { value: 0 }
            frameRef.current = null
            applyGenieFrame(0, false)
            tweenRef.current = gsap.to(progress, {
                value: 1,
                duration: CLOSE_DURATION,
                ease: 'sine.in',
                onUpdate: () => {
                    applyGenieFrame(progress.value, false)
                },
                onComplete: () => {
                    gsap.set(el, {
                        visibility: 'hidden',
                        opacity: 0,
                    })
                    dragRef.current?.kill()
                    dragRef.current = null
                    setIsVisible(false)
                },
            })

            return () => {
                tweenRef.current?.kill()
                fullscreenTweenRef.current?.kill()
            }
        }, [isOpen, isVisible, windowKey])

        if (!isVisible) return null

        const topInset = getMenuCeiling()
        const windowStyle = isMaximized
            ? {
                zIndex: win?.zIndex ?? 1,
                position: 'fixed',
                top: `${topInset}px`,
                left: '12px',
                width: 'calc(100vw - 24px)',
                height: `calc(100vh - ${topInset + 12}px)`,
                maxWidth: 'none',
            }
            : { zIndex: win?.zIndex ?? 1 }

        return (
            <section
                ref={windowRef}
                id={windowKey}
                style={windowStyle}
                className="absolute"
                onMouseDown={(event) => {
                    const rect = toRectSnapshot(event.currentTarget.getBoundingClientRect())
                    lastRectRef.current = rect
                    if (!isMaximized) {
                        restoreRectRef.current = rect
                    }
                    focusWindow(windowKey)
                }}
            >
                <Component {...props} />
            </section>
        )
    }

    WrappedComponent.displayName = `WindowWrapper(${Component.displayName || Component.name || 'Component'})`
    return WrappedComponent
}

export default WindowWrapper