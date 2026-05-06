// src/components/ui/map.jsx
import React, {
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAP_STYLES = {
  light: 'mapbox://styles/mapbox/standard',
  dark: 'mapbox://styles/mapbox/standard',
}

const MapInstanceContext = React.createContext(null)

// Ad-blockers often block Mapbox telemetry calls; disable telemetry to avoid noise.
mapboxgl.setTelemetryEnabled?.(false)

/**
 * Main map canvas – direct mapbox-gl implementation.
 * For compatibility, it preserves the existing component props and forwarded ref.
 */
export const Map = React.forwardRef(
  (
    {
      children,
      className,
      center = [0, 0],
      zoom = 2,
      pitch = 0,
      maxPitch = 85,
      mapboxAccessToken,
      theme = 'light',
      ...props
    },
    ref,
  ) => {
    const containerRef = useRef(null)
    const mapRef = useRef(null)
    const [readyMap, setReadyMap] = useState(null)
    const mapStyle = MAP_STYLES[theme] ?? MAP_STYLES.light

    const accessToken = mapboxAccessToken || import.meta.env.VITE_MAPBOX_TOKEN

    useEffect(() => {
      if (!accessToken) {
        console.warn('[Map] Missing Mapbox access token. The map canvas will remain empty until VITE_MAPBOX_TOKEN or mapboxAccessToken is provided.')
        return
      }

      mapboxgl.accessToken = accessToken
    }, [accessToken])

    // Keep forwarded ref in sync with the live map instance (do not freeze initial null).
    useImperativeHandle(ref, () => mapRef.current)

    useEffect(() => {
      if (!containerRef.current || mapRef.current) return

      if (!accessToken) {
        console.warn('[Map] Skipping map initialization because no Mapbox access token is available.')
        return
      }

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: mapStyle,
        center,
        zoom,
        pitch,
        maxPitch,
        performanceMetricsCollection: false,
        attributionControl: false,
        ...props,
      })

      mapRef.current = map
      setReadyMap(map)

      // Resize observer to keep canvas sized when sidebar collapses or window changes
      let ro
      try {
        ro = new ResizeObserver(() => {
          map.resize()
        })
        ro.observe(containerRef.current)
      } catch {
        // ResizeObserver not available in some test envs
      }

      return () => {
        ro?.disconnect()
        map.remove()
        mapRef.current = null
        setReadyMap(null)
      }
    }, [accessToken])

    useEffect(() => {
      const map = mapRef.current
      if (!map) return
      map.setMaxPitch(maxPitch)
    }, [maxPitch])

    useEffect(() => {
      const map = mapRef.current
      if (!map) return
      // Use easeTo for smoother pitch transitions instead of immediate setPitch
      try {
        map.easeTo({ pitch, duration: 600 })
      } catch {
        map.setPitch(pitch)
      }
    }, [pitch])

    useEffect(() => {
      const map = mapRef.current
      if (!map) return
      const targetStyle = MAP_STYLES[theme] ?? MAP_STYLES.light

      const applyStyle = () => {
        try {
          map.setStyle(targetStyle)
        } catch {
          // ignore style set errors
        }
      }

      // Don't read style properties directly while a style is loading; use isStyleLoaded or styledata event.
      if (typeof map.isStyleLoaded === 'function') {
        if (map.isStyleLoaded()) {
          applyStyle()
        } else {
          map.once('styledata', applyStyle)
        }
      } else {
        applyStyle()
      }

      return () => {
        try {
          map.off('styledata', applyStyle)
        } catch {
          /* ignore */
        }
      }
    }, [theme])
    useEffect(() => {
  const map = mapRef.current
  if (!map) return

  const applyPreset = () => {
    try {
      map.setConfigProperty(
        'basemap',
        'lightPreset',
        theme === 'dark' ? 'night' : 'dawn'
      )
    } catch {}
  }

  map.on('style.load', applyPreset)

  // Also try immediately (in case already loaded)
  applyPreset()

  return () => {
    map.off('style.load', applyPreset)
  }
}, [theme])

    return (
      <div ref={containerRef} className={className}>
        {readyMap ? (
          <MapInstanceContext.Provider value={readyMap}>{children}</MapInstanceContext.Provider>
        ) : null}
      </div>
    )
  },
)

Map.displayName = 'Map'

// Keep both exports for compatibility with existing imports.
export const MapCanvas = Map

export const MapMarker = ({
  longitude,
  latitude,
  anchor = 'center',
  offset,
  onClick,
  children,
}) => {
  const map = useContext(MapInstanceContext)
  const markerRef = useRef(null)
  const markerElement = useMemo(() => {
    if (typeof document === 'undefined') return null
    return document.createElement('div')
  }, [])

  useEffect(() => {
    if (!map || !markerElement) return

    const marker = new mapboxgl.Marker({
      element: markerElement,
      anchor,
      offset,
    })
      .setLngLat([longitude, latitude])
      .addTo(map)

    markerRef.current = marker

    return () => {
      marker.remove()
      markerRef.current = null
    }
  }, [anchor, map, markerElement, offset])

  useEffect(() => {
    if (!markerRef.current) return
    markerRef.current.setLngLat([longitude, latitude])
  }, [longitude, latitude])

  useEffect(() => {
    if (!markerElement || !onClick) return

    const handleClick = (event) => {
      event.stopPropagation()
      onClick(event)
    }

    markerElement.addEventListener('click', handleClick)
    return () => markerElement.removeEventListener('click', handleClick)
  }, [markerElement, onClick])

  if (!markerElement) return null
  return createPortal(children, markerElement)
}

/**
 * Minimal container for marker content – used to apply custom className.
 */
export const MarkerContent = ({ className, children, ...rest }) => (
  <div className={className} {...rest}>
    {children}
  </div>
)