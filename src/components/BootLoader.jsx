import React, { useEffect, useRef, useState } from 'react'

const DEFAULT_LOGO_DURATION_MS = 2800
const DEFAULT_COMPLETE_HOLD_MS = 350
const DEFAULT_EXIT_DURATION_MS = 520
const DEFAULT_SOUND_DELAY_MS = 120
const POPUP_FADE_OUT_MS = 360

const clampDuration = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

const BootLoader = ({
  onComplete,
  onExitStart,
  logoDurationMs = DEFAULT_LOGO_DURATION_MS,
  completeHoldMs = DEFAULT_COMPLETE_HOLD_MS,
  exitDurationMs = DEFAULT_EXIT_DURATION_MS,
  startupSoundSrc = '',
  startupSoundDelayMs = DEFAULT_SOUND_DELAY_MS,
}) => {
  const [popupSvgMarkup, setPopupSvgMarkup] = useState('')
  const [isStarting, setIsStarting] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isExiting, setIsExiting] = useState(false)
  const doneRef = useRef(false)
  const startupAudioRef = useRef(null)
  const unlockHandlerRef = useRef(null)
  const popupFadeTimeoutRef = useRef(null)

  const bootDuration = clampDuration(logoDurationMs, DEFAULT_LOGO_DURATION_MS)
  const holdDuration = clampDuration(completeHoldMs, DEFAULT_COMPLETE_HOLD_MS)
  const exitDuration = clampDuration(exitDurationMs, DEFAULT_EXIT_DURATION_MS)
  const soundDelay = clampDuration(startupSoundDelayMs, DEFAULT_SOUND_DELAY_MS)

  useEffect(() => {
    let isMounted = true

    fetch('/icons/Bootloader.svg')
      .then((response) => (response.ok ? response.text() : ''))
      .then((svgMarkup) => {
        if (isMounted) {
          setPopupSvgMarkup(svgMarkup)
        }
      })
      .catch(() => {
        if (isMounted) {
          setPopupSvgMarkup('')
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!startupSoundSrc) {
      startupAudioRef.current = null
      return undefined
    }

    const audio = new Audio(startupSoundSrc)
    audio.preload = 'auto'
    audio.load()
    startupAudioRef.current = audio

    return () => {
      audio.pause()
      audio.src = ''
      startupAudioRef.current = null
    }
  }, [startupSoundSrc])

  useEffect(() => {
    return () => {
      if (popupFadeTimeoutRef.current) {
        clearTimeout(popupFadeTimeoutRef.current)
      }

      if (unlockHandlerRef.current) {
        window.removeEventListener('pointerdown', unlockHandlerRef.current)
        window.removeEventListener('keydown', unlockHandlerRef.current)
        window.removeEventListener('touchstart', unlockHandlerRef.current)
        unlockHandlerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!hasStarted) return undefined

    const startTime = performance.now()
    let rafId = 0

    const tick = (now) => {
      const elapsed = now - startTime
      const ratio = Math.min(elapsed / bootDuration, 1)

      // Smooth out the progress so it feels closer to a macOS boot loader.
      const eased = 1 - Math.pow(1 - ratio, 2.1)
      const nextProgress = Math.min(100, Math.round(eased * 100))
      setProgress(nextProgress)

      if (ratio < 1) {
        rafId = requestAnimationFrame(tick)
      }
    }

    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [hasStarted, bootDuration])

  useEffect(() => {
    if (!hasStarted) return
    if (progress < 100 || doneRef.current) return

    doneRef.current = true
    let soundTimeoutId = null

    const holdTimeoutId = window.setTimeout(() => {
      setIsExiting(true)
      if (onExitStart) onExitStart()

      if (startupSoundSrc) {
        soundTimeoutId = window.setTimeout(() => {
          const startupAudio = startupAudioRef.current || new Audio(startupSoundSrc)
          startupAudioRef.current = startupAudio
          startupAudio.currentTime = 0

          startupAudio.play().catch(() => {
            // Some browsers block autoplay with sound until user interaction.
            if (unlockHandlerRef.current) return

            const retryPlayback = () => {
              startupAudio.currentTime = 0
              startupAudio.play().catch(() => {
                // If this still fails, keep boot flow uninterrupted.
              })

              window.removeEventListener('pointerdown', retryPlayback)
              window.removeEventListener('keydown', retryPlayback)
              window.removeEventListener('touchstart', retryPlayback)
              unlockHandlerRef.current = null
            }

            unlockHandlerRef.current = retryPlayback
            window.addEventListener('pointerdown', retryPlayback, { once: true })
            window.addEventListener('keydown', retryPlayback, { once: true })
            window.addEventListener('touchstart', retryPlayback, { once: true })
          })
        }, soundDelay)
      }
    }, holdDuration)

    const completeTimeoutId = window.setTimeout(() => {
      onComplete()
    }, holdDuration + exitDuration)

    return () => {
      clearTimeout(holdTimeoutId)
      clearTimeout(completeTimeoutId)
      if (soundTimeoutId) {
        clearTimeout(soundTimeoutId)
      }
    }
  }, [hasStarted, progress, onComplete, onExitStart, startupSoundSrc, soundDelay, holdDuration, exitDuration])

  const handleStart = () => {
    if (hasStarted || isStarting) return

    setIsStarting(true)

    const startupAudio = startupAudioRef.current
    if (startupAudio) {
      startupAudio.muted = true
      startupAudio.currentTime = 0
      startupAudio.play().then(() => {
        startupAudio.pause()
        startupAudio.currentTime = 0
        startupAudio.muted = false
      }).catch(() => {
        startupAudio.muted = false
      })
    }

    popupFadeTimeoutRef.current = window.setTimeout(() => {
      setHasStarted(true)
    }, POPUP_FADE_OUT_MS)
  }

  return (
    <div
      className={`boot-loader ${isExiting ? 'is-exiting' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Starting macOS experience"
    >
      <div className="boot-loader__vignette" aria-hidden="true" />

      <div className="boot-loader__center">
        {!hasStarted ? (
          <div
            className={`boot-loader__start-popup ${isStarting ? 'is-starting' : ''}`}
            role="dialog"
            aria-label="Bootloader startup dialog"
          >
            <div
              className={`boot-loader__start-popup-svg ${isStarting ? 'is-fading-out' : ''}`}
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: popupSvgMarkup }}
            />
            <button
              type="button"
              className="boot-loader__start-hotspot"
              onClick={handleStart}
              disabled={isStarting}
              aria-label="Start"
            >
              Start
            </button>
          </div>
        ) : (
          <>
            <img src="/images/logo.svg" alt="" className="boot-loader__apple-logo" />

            <div className="boot-loader__progress-track">
              <div className="boot-loader__progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default BootLoader
