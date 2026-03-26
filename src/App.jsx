import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Dock, Navbar, Welcome } from '#components'
import {gsap} from 'gsap'
import { Draggable } from 'gsap/Draggable'
import { Terminal, Safari, Resume } from '#windows';
import BootLoader from '#components/BootLoader';
import uiConfig from './config/ui.json'
gsap.registerPlugin(Draggable);

const App = () => {
  const [showBootLoader, setShowBootLoader] = useState(true)
  const [isDesktopEntering, setIsDesktopEntering] = useState(false)
  const enterTimeoutRef = useRef(null)

  useEffect(() => {
    return () => {
      if (enterTimeoutRef.current) {
        clearTimeout(enterTimeoutRef.current)
      }
    }
  }, [])

  const handleBootExitStart = useCallback(() => {
    setIsDesktopEntering(true)

    if (enterTimeoutRef.current) {
      clearTimeout(enterTimeoutRef.current)
    }

    enterTimeoutRef.current = window.setTimeout(() => {
      setIsDesktopEntering(false)
    }, 2200)
  }, [])

  const handleBootComplete = useCallback(() => {
    setShowBootLoader(false)
  }, [])

  return (
    <main>
      {showBootLoader && (
        <BootLoader
          onExitStart={handleBootExitStart}
          onComplete={handleBootComplete}
          logoDurationMs={uiConfig.bootLoader?.logoDurationMs}
          completeHoldMs={uiConfig.bootLoader?.completeHoldMs}
          exitDurationMs={uiConfig.bootLoader?.exitDurationMs}
          startupSoundSrc={uiConfig.bootLoader?.startupSoundSrc}
          startupSoundDelayMs={uiConfig.bootLoader?.startupSoundDelayMs}
        />
      )}

      <section className={`desktop-shell ${isDesktopEntering ? 'is-entering' : ''}`}>
        <Navbar />
        <Welcome />
        <Dock />

        <Terminal />
        <Safari />
        <Resume />
      </section>
    </main>
  )
}

export default App