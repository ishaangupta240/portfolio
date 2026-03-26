import React, { useEffect, useRef, useState } from 'react'
import WindowWrapper from '#hoc/WindowWrapper'
import WindowControls from '#components/WindowControls'
import mapKitConfig from '../config/mapkit.json'

const DEFAULT_MAP_IFRAME_URL =
  'https://maps.apple.com/frame?center=28.567278%2C77.336799&span=0.095755%2C0.102899'

const Map = () => {
  const mapShellRef = useRef(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isFrameBlocked, setIsFrameBlocked] = useState(false)
  const [didFrameLoad, setDidFrameLoad] = useState(false)
  const iframeUrl = mapKitConfig.iframeUrl || DEFAULT_MAP_IFRAME_URL
  const openMapUrl = mapKitConfig.openMapUrl || iframeUrl.replace('/frame?', '/?')

  useEffect(() => {
    const shell = mapShellRef.current
    if (!shell) return

    const onWheel = (event) => {
      // Best effort: block zoom-out wheel gestures while allowing scroll/zoom-in direction.
      if (event.deltaY > 0) {
        event.preventDefault()
      }
    }

    shell.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      shell.removeEventListener('wheel', onWheel)
    }
  }, [])

  useEffect(() => {
    if (!iframeUrl) return

    setIsFrameBlocked(false)
    setDidFrameLoad(false)

    const timer = window.setTimeout(() => {
      if (!didFrameLoad) {
        setIsFrameBlocked(true)
      }
    }, 3200)

    return () => {
      clearTimeout(timer)
    }
  }, [iframeUrl, didFrameLoad])

  useEffect(() => {
    if (!iframeUrl) {
      setErrorMessage('Missing iframe URL. Add iframeUrl in src/config/mapkit.json.')
      return
    }

    setErrorMessage('')
  }, [iframeUrl])

  return (
    <>
      <div className="window-header">
        <WindowControls target="map" />
        <h2>Maps - Noida</h2>
      </div>

      <div ref={mapShellRef} className="map-shell">
        <iframe
          className="map-canvas map-frame"
          src={iframeUrl}
          title="Apple Maps Noida"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          onLoad={() => setDidFrameLoad(true)}
          onError={() => setIsFrameBlocked(true)}
        />
        {isFrameBlocked ? (
          <div className="map-message">
            <div>
              <p>maps.apple.com refused to connect in an embedded frame.</p>
              <a href={openMapUrl} target="_blank" rel="noreferrer" className="map-open-link">
                Open Noida in Apple Maps
              </a>
            </div>
          </div>
        ) : null}
        {errorMessage ? <div className="map-message">{errorMessage}</div> : null}
      </div>
    </>
  )
}

const MapWindow = WindowWrapper(Map, 'map')

export default MapWindow
