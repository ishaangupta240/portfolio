import React, { useMemo, useState, useEffect, useRef } from 'react'
import WindowWrapper from '#hoc/WindowWrapper'
import WindowControls from '#components/WindowControls'
import { Map as MapCanvas, MapControls } from '@/components/ui/map'

const MAP_STYLES = {
  '2d': 'https://tiles.openfreemap.org/styles/bright',
  '3d': 'https://tiles.openfreemap.org/styles/liberty',
}

const MapView = () => {
  const latitude = 28.57085
  const longitude = 77.32593
  const latitudeDelta = 0.08
  const longitudeDelta = 0.08

  const mapRef = useRef(null)
  const [mode, setMode] = useState('2d')
  const is3D = mode === '3d'

  useEffect(() => {
    mapRef.current?.easeTo({
      pitch: is3D ? 60 : 0,
      duration: 500,
    })
  }, [is3D])

  const initialZoom = 12

  const maxBounds = useMemo(() => {
    const halfLat = latitudeDelta / 2
    const halfLng = longitudeDelta / 2

    return [
      [longitude - halfLng, latitude - halfLat],
      [longitude + halfLng, latitude + halfLat],
    ]
  }, [latitude, longitude, latitudeDelta, longitudeDelta])

  const selectedStyle = MAP_STYLES[mode]

  return (
    <>
      <div className="window-header">
        <WindowControls target="map" />
        <h2>Maps</h2>
      </div>

      <div className={`map-shell ${is3D ? 'is-3d' : 'is-2d'}`}>
        <div className="h-full relative w-full">
          <MapCanvas
            ref={mapRef}
            center={[longitude, latitude]}
            zoom={initialZoom}
            projection="mercator"
            styles={selectedStyle ? { light: selectedStyle, dark: selectedStyle } : undefined}
            theme="dark"
          >
            <MapControls
              className="map-native-controls"
              position="bottom-right"
              showZoom
              showCompass
              showLocate={false}
              showFullscreen={false}
            />
          </MapCanvas>

          <div className="map-mode-switch" role="group" aria-label="Map mode">
            <button
              type="button"
              className={`map-mode-btn ${mode === '2d' ? 'is-active' : ''}`}
              onClick={() => setMode('2d')}
              aria-pressed={mode === '2d'}
            >
              2D
            </button>
            <button
              type="button"
              className={`map-mode-btn ${mode === '3d' ? 'is-active' : ''}`}
              onClick={() => setMode('3d')}
              aria-pressed={mode === '3d'}
            >
              3D
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

const MapWindow = WindowWrapper(MapView, 'map')

export default MapWindow
