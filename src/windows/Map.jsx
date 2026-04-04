import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import WindowWrapper from '#hoc/WindowWrapper'
import WindowControls from '#components/WindowControls'
import { Map as MapCanvas, MapMarker, MarkerContent } from '@/components/ui/map'

const MAP_STYLES = {
  '2d': 'https://tiles.openfreemap.org/styles/bright',
  '3d': 'https://tiles.openfreemap.org/styles/liberty',
}

const getThemeFromDocument = () => {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

const LIBRARY_PLACES = [
  {
    id: 'home',
    name: 'Home',
    detail: 'Noida, Uttar Pradesh',
    eta: '12 min',
    lat: 28.57085,
    lng: 77.32593,
    zoom: 14,
    emoji: '🏠',
  },
  {
    id: 'work',
    name: 'Work',
    detail: 'Connaught Place, Delhi',
    eta: '34 min',
    lat: 28.6315,
    lng: 77.2167,
    zoom: 14,
    emoji: '💼',
  },
  {
    id: 'airport',
    name: 'IGI Airport',
    detail: 'Terminal 3',
    eta: '46 min',
    lat: 28.5562,
    lng: 77.1,
    zoom: 12,
    emoji: '✈️',
  },
]

const GUIDE_PLACES = [
  {
    id: 'india-gate',
    name: 'India Gate',
    detail: 'War memorial and lawns',
    eta: '26 min',
    lat: 28.6129,
    lng: 77.2295,
    zoom: 15,
    emoji: '🏛️',
  },
  {
    id: 'qutub-minar',
    name: 'Qutub Minar',
    detail: 'UNESCO world heritage site',
    eta: '31 min',
    lat: 28.5245,
    lng: 77.1855,
    zoom: 16,
    emoji: '🗼',
  },
  {
    id: 'lotus-temple',
    name: 'Lotus Temple',
    detail: 'Bahai House of Worship',
    eta: '29 min',
    lat: 28.5535,
    lng: 77.2588,
    zoom: 15,
    emoji: '🪷',
  },
]

const FEATURED_PLACES = [
  {
    id: 'humayun-tomb',
    name: 'Humayun\'s Tomb',
    detail: 'Mughal architecture',
    eta: '24 min',
    lat: 28.5933,
    lng: 77.2507,
    zoom: 16,
    emoji: '🕌',
  },
  {
    id: 'akshardham',
    name: 'Akshardham',
    detail: 'Temple and gardens',
    eta: '22 min',
    lat: 28.6127,
    lng: 77.2773,
    zoom: 16,
    emoji: '🛕',
  },
  {
    id: 'hauz-khas',
    name: 'Hauz Khas Village',
    detail: 'Cafe district and fort',
    eta: '37 min',
    lat: 28.5494,
    lng: 77.2001,
    zoom: 15,
    emoji: '🥐',
  },
]

const SEARCH_LOCATIONS = [
  ...LIBRARY_PLACES,
  ...GUIDE_PLACES,
  ...FEATURED_PLACES,
]

const CARDINAL_HEADINGS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

const normalizeBearing = (value) => {
  const normalized = value % 360
  return normalized < 0 ? normalized + 360 : normalized
}

const toCompassHeading = (value) => {
  const index = Math.round(normalizeBearing(value) / 45) % CARDINAL_HEADINGS.length
  return CARDINAL_HEADINGS[index]
}

const getCompassAngle = (x, y, centerX, centerY) => {
  const radians = Math.atan2(x - centerX, centerY - y)
  return normalizeBearing((radians * 180) / Math.PI)
}

const shortestAngleDelta = (from, to) => {
  let delta = to - from
  if (delta > 180) delta -= 360
  if (delta < -180) delta += 360
  return delta
}

const CompassIcon = ({ bearing, pitch }) => (
  <svg
    viewBox="-3 -2 46 46"
    className="map-compass-svg"
    style={{
      transform: `rotateX(${pitch * 0.6}deg) rotateZ(${-bearing}deg)`,
      transformStyle: 'preserve-3d',
    }}
  >
    <g fillRule="evenodd" className="mw-compass-group">
      {/* Outer tick marks / ring details */}
      <path
        d="M27.127,34.924 C27.135,34.944 27.142,34.964 27.147,34.984 L28.037,38.326 C28.102,38.570 27.975,38.825 27.741,38.919 L27.529,39.004 C27.296,39.098 27.029,39.004 26.906,38.784 L25.217,35.762 C25.147,35.637 25.134,35.487 25.182,35.352 C25.230,35.216 25.334,35.108 25.467,35.054 L26.477,34.648 C26.733,34.545 27.023,34.669 27.127,34.924 Z M13.505,34.634 C13.525,34.640 13.544,34.646 13.563,34.654 L14.565,35.078 C14.697,35.134 14.799,35.244 14.844,35.381 C14.890,35.517 14.874,35.666 14.802,35.790 L13.062,38.782 C12.936,39.001 12.666,39.091 12.434,38.992 L12.224,38.902 C11.992,38.804 11.869,38.548 11.938,38.305 L12.888,34.977 C12.964,34.712 13.240,34.558 13.505,34.633 Z M32.092,31.112 L32.132,31.158 L34.262,33.889 C34.418,34.088 34.401,34.372 34.222,34.551 L34.061,34.711 C33.882,34.889 33.600,34.906 33.401,34.751 L30.663,32.627 C30.549,32.539 30.479,32.407 30.470,32.263 C30.461,32.120 30.514,31.980 30.616,31.878 L31.386,31.111 C31.581,30.917 31.897,30.917 32.092,31.112 Z M8.570,31.072 C8.586,31.085 8.601,31.098 8.616,31.112 L9.386,31.879 C9.488,31.981 9.541,32.121 9.532,32.265 C9.523,32.409 9.452,32.541 9.338,32.629 L6.600,34.752 C6.401,34.907 6.119,34.890 5.940,34.712 L5.780,34.552 C5.600,34.374 5.582,34.089 5.738,33.889 L7.868,31.159 C7.949,31.054 8.069,30.986 8.201,30.970 C8.332,30.953 8.465,30.990 8.570,31.071 Z M35.249,25.682 C35.268,25.690 35.286,25.699 35.303,25.709 L38.305,27.446 C38.524,27.573 38.615,27.843 38.515,28.076 L38.427,28.282 C38.329,28.514 38.073,28.637 37.830,28.568 L34.492,27.621 C34.354,27.582 34.239,27.485 34.177,27.356 C34.115,27.226 34.112,27.076 34.168,26.944 L34.593,25.946 C34.645,25.824 34.743,25.728 34.866,25.678 C34.989,25.629 35.127,25.630 35.249,25.682 Z M5.382,25.892 C5.392,25.910 5.401,25.928 5.409,25.946 L5.834,26.944 C5.890,27.076 5.887,27.226 5.825,27.356 C5.763,27.485 5.648,27.582 5.510,27.621 L2.172,28.568 C1.929,28.637 1.673,28.514 1.575,28.282 L1.487,28.075 C1.388,27.843 1.478,27.573 1.697,27.446 L4.699,25.709 C4.938,25.571 5.244,25.652 5.382,25.891 Z M2.170,12.484 L5.508,13.431 C5.646,13.470 5.761,13.567 5.823,13.696 C5.885,13.826 5.888,13.976 5.832,14.108 L5.407,15.106 C5.351,15.238 5.241,15.339 5.105,15.384 C4.970,15.430 4.821,15.415 4.697,15.343 L1.695,13.606 C1.476,13.480 1.386,13.210 1.485,12.977 L1.573,12.770 C1.671,12.538 1.927,12.415 2.170,12.484 Z M38.441,12.804 L38.526,13.014 C38.621,13.248 38.527,13.516 38.306,13.639 L35.273,15.323 C35.148,15.393 34.999,15.405 34.864,15.358 C34.729,15.310 34.621,15.207 34.567,15.074 L34.160,14.069 C34.106,13.936 34.112,13.787 34.177,13.659 C34.241,13.531 34.357,13.436 34.495,13.399 L37.850,12.509 C38.093,12.445 38.347,12.572 38.441,12.805 Z M34.061,6.342 L34.221,6.502 C34.400,6.680 34.418,6.965 34.263,7.164 L32.133,9.895 C32.045,10.008 31.913,10.078 31.770,10.087 C31.627,10.096 31.486,10.043 31.385,9.942 L30.615,9.175 C30.513,9.073 30.460,8.933 30.469,8.789 C30.478,8.646 30.549,8.513 30.663,8.425 L33.400,6.302 C33.599,6.148 33.882,6.165 34.060,6.343 Z M6.599,6.302 L9.337,8.426 C9.451,8.514 9.521,8.647 9.530,8.791 C9.539,8.934 9.486,9.075 9.384,9.176 L8.614,9.942 C8.513,10.043 8.373,10.095 8.230,10.086 C8.088,10.077 7.956,10.008 7.868,9.895 L5.738,7.165 C5.581,6.966 5.599,6.681 5.778,6.502 L5.939,6.342 C6.118,6.164 6.400,6.147 6.599,6.302 Z M13.094,2.269 L14.783,5.291 C14.853,5.417 14.866,5.566 14.818,5.702 C14.770,5.837 14.666,5.946 14.533,5.999 L13.523,6.406 C13.390,6.460 13.240,6.453 13.112,6.389 C12.984,6.325 12.890,6.209 12.853,6.070 L11.963,2.727 C11.898,2.483 12.025,2.229 12.259,2.134 L12.471,2.049 C12.704,1.955 12.971,2.050 13.094,2.269 Z M27.566,2.062 L27.776,2.152 C28.008,2.251 28.131,2.506 28.062,2.749 L27.112,6.076 C27.073,6.214 26.977,6.328 26.847,6.390 C26.718,6.452 26.569,6.456 26.437,6.400 L25.435,5.975 C25.303,5.919 25.201,5.809 25.156,5.673 C25.110,5.536 25.126,5.387 25.198,5.263 L26.938,2.271 C27.065,2.053 27.334,1.963 27.566,2.062 Z M20.114,0.582 C20.366,0.582 20.578,0.769 20.610,1.019 L21.040,4.451 C21.058,4.593 21.014,4.737 20.919,4.844 C20.825,4.952 20.688,5.014 20.545,5.014 L19.455,5.014 C19.311,5.014 19.175,4.952 19.080,4.845 C18.985,4.737 18.941,4.594 18.959,4.451 L19.389,1.019 C19.420,0.769 19.634,0.581 19.886,0.581 L20.114,0.581 Z"
        fillOpacity="0.2"
        fill="#FFFFFF"
      />
      {/* Cardinal direction markers (E/W/S dots) */}
      <path
        d="M20.545,36.040 C20.688,36.040 20.825,36.102 20.920,36.209 C21.015,36.317 21.059,36.460 21.041,36.602 L20.611,40.034 C20.580,40.285 20.366,40.472 20.114,40.472 L19.886,40.472 C19.634,40.472 19.421,40.284 19.390,40.034 L18.960,36.602 C18.942,36.460 18.986,36.317 19.081,36.210 C19.176,36.102 19.312,36.040 19.455,36.040 L20.545,36.040 Z M4.440,19.922 C4.442,19.943 4.443,19.963 4.443,19.984 L4.443,21.068 C4.443,21.211 4.381,21.348 4.274,21.442 C4.167,21.537 4.024,21.582 3.882,21.564 L0.437,21.134 C0.188,21.103 0.001,20.891 0,20.640 L0,20.415 C0,20.163 0.187,19.949 0.438,19.918 L3.883,19.489 C4.157,19.455 4.407,19.649 4.441,19.923 Z M36.055,19.484 C36.075,19.484 36.096,19.486 36.116,19.488 L39.561,19.918 C39.811,19.949 39.999,20.162 39.999,20.414 L39.999,20.639 C39.999,20.891 39.811,21.104 39.561,21.135 L36.116,21.565 C35.974,21.583 35.831,21.538 35.723,21.443 C35.616,21.348 35.555,21.212 35.555,21.068 L35.555,19.984 C35.555,19.708 35.779,19.484 36.055,19.484 Z"
        fillOpacity="0.64"
        fill="#FFFFFF"
      />
      {/* North needle (red) */}
      <path
        d="M20.432,0.256 L22.794,4.490 C22.888,4.658 22.876,4.866 22.765,5.023 C22.654,5.180 22.462,5.259 22.272,5.226 C20.768,4.962 19.230,4.962 17.726,5.227 C17.536,5.260 17.344,5.181 17.232,5.024 C17.120,4.867 17.109,4.660 17.203,4.491 L19.559,0.256 C19.647,0.098 19.814,0 19.996,0 C20.177,0 20.344,0.098 20.432,0.256 Z"
        fill="#FF453A"
      />
    </g>
  </svg>
)

const MapSearch = ({ places, onSelect }) => {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  const handleSelectPlace = useCallback((place) => {
    onSelect(place)
    setQuery(place.name)
    setFocused(false)
  }, [onSelect])

  const results = useMemo(() => {
    if (!query.trim()) return places.slice(0, 6)
    const q = query.toLowerCase()
    return places.filter(p => p.name.toLowerCase().includes(q)).slice(0, 6)
  }, [places, query])

  const showDropdown = focused && results.length > 0

  return (
    <div className="map-search-container">
      <div className={`map-search-bar liquid-glass-static map-liquid-surface ${focused ? 'is-focused' : ''}`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="map-search-icon">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="map-search-input"
          placeholder="Search Maps"
          aria-label="Search maps"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={(event) => {
            const nextFocused = event.relatedTarget
            if (nextFocused instanceof HTMLElement && dropdownRef.current?.contains(nextFocused)) {
              return
            }
            setFocused(false)
          }}
        />
        {query && (
          <button
            type="button"
            className="map-search-clear"
            aria-label="Clear search"
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="rgba(255,255,255,0.3)"/><path d="M15 9L9 15M9 9l6 6" stroke="rgba(0,0,0,0.6)" strokeWidth="2.5" strokeLinecap="round"/></svg>
          </button>
        )}
      </div>
      {showDropdown && (
        <div ref={dropdownRef} className="map-search-dropdown liquid-glass-static map-liquid-surface">
          {results.map(place => (
            <button
              key={place.id}
              type="button"
              className="map-search-result"
              onMouseDown={() => handleSelectPlace(place)}
              onClick={() => handleSelectPlace(place)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  handleSelectPlace(place)
                }
              }}
            >
              <span className="map-search-result-emoji" aria-hidden="true">{place.emoji ?? '📍'}</span>
              <span className="map-search-result-copy">
                <span className="map-search-result-name">{place.name}</span>
                <span className="map-search-result-detail">{place.detail}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const SidebarSection = ({ title, places, activePlaceId, onSelect }) => (
  <section className="map-sidebar-section">
    <h3>{title}</h3>
    <div className="map-sidebar-list liquid-glass-static map-liquid-surface">
      {places.map(place => (
        <button
          key={place.id}
          type="button"
          className={`map-sidebar-item ${activePlaceId === place.id ? 'is-active' : ''}`}
          onClick={() => onSelect(place)}
        >
          <span className="map-sidebar-item-emoji" aria-hidden="true">{place.emoji ?? '📍'}</span>
          <span className="map-sidebar-item-copy">
            <span className="map-sidebar-item-name">{place.name}</span>
            <span className="map-sidebar-item-detail">{place.detail}</span>
          </span>
          <span className="map-sidebar-item-eta">{place.eta}</span>
        </button>
      ))}
    </div>
  </section>
)

const LocateIcon = ({ loading }) => (
  loading ? (
    <span className="map-loading-dot" aria-hidden="true" />
  ) : (
    <img src="/images/location.svg" className="map-locate-icon" alt="" aria-hidden="true" />
  )
)

const ActivePlaceCard = ({ place, onFocus }) => {
  if (!place) return null

  return (
    <div className="map-selection-card liquid-glass-static map-liquid-surface">
      <div className="map-selection-copy">
        <p className="map-selection-title">
          <span className="map-selection-emoji" aria-hidden="true">{place.emoji ?? '📍'}</span>
          <span>{place.name}</span>
        </p>
        <p className="map-selection-detail">{place.detail}</p>
      </div>
      <button type="button" className="map-selection-btn" onClick={() => onFocus(place)}>
        🧭 Directions
      </button>
    </div>
  )
}

const MapLocationMarker = ({ place, active, onSelect }) => (
  <MapMarker
    longitude={place.lng}
    latitude={place.lat}
    anchor="bottom"
    offset={[0, 6]}
    onClick={() => onSelect(place)}
  >
    <MarkerContent className={`map-emoji-marker ${active ? 'is-active' : ''}`}>
      <span className="map-emoji-marker-pin" role="img" aria-label={`${place.name} marker`}>
        {place.emoji ?? '📍'}
      </span>
      <span className="map-emoji-marker-label">{place.name}</span>
    </MarkerContent>
  </MapMarker>
)

const MapView = () => {
  const defaultPlace = LIBRARY_PLACES[0]
  const latitude = defaultPlace.lat
  const longitude = defaultPlace.lng

  const mapRef = useRef(null)
  const compassButtonRef = useRef(null)
  const compassDragRef = useRef({
    active: false,
    moved: false,
    pointerId: null,
    centerX: 0,
    centerY: 0,
    startAngle: 0,
    startBearing: 0,
  })
  const [mode, setMode] = useState('2d')
  const [panelTab, setPanelTab] = useState('explore')
  const [bearing, setBearing] = useState(0)
  const [pitch, setPitch] = useState(0)
  const [isCompassDragging, setIsCompassDragging] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [activePlace, setActivePlace] = useState(defaultPlace)
  const [dynamicPlaces, setDynamicPlaces] = useState([])
  const [mapTheme, setMapTheme] = useState(getThemeFromDocument)
  const is3D = mode === '3d'
  const heading = useMemo(() => toCompassHeading(bearing), [bearing])
  const headingDegrees = useMemo(() => Math.round(normalizeBearing(bearing)), [bearing])

  const allPlaces = useMemo(() => {
    const merged = [...SEARCH_LOCATIONS, ...dynamicPlaces]
    const uniqueById = new Map()
    merged.forEach(place => {
      uniqueById.set(place.id, place)
    })
    return Array.from(uniqueById.values())
  }, [dynamicPlaces])

  useEffect(() => {
    let frameId
    let unbindMapListeners

    const bindListeners = () => {
      const map = mapRef.current
      if (!map) {
        frameId = requestAnimationFrame(bindListeners)
        return
      }

      const update = () => {
        setBearing(map.getBearing())
        setPitch(map.getPitch())
      }

      map.on('rotate', update)
      map.on('pitch', update)
      map.on('moveend', update)
      update()

      unbindMapListeners = () => {
        map.off('rotate', update)
        map.off('pitch', update)
        map.off('moveend', update)
      }
    }

    bindListeners()

    return () => {
      if (frameId) cancelAnimationFrame(frameId)
      unbindMapListeners?.()
    }
  }, [])

  useEffect(() => {
    mapRef.current?.easeTo({ pitch: is3D ? 62 : 0, duration: 520 })
  }, [is3D])

  useEffect(() => {
    const root = document.documentElement
    const syncTheme = () => {
      setMapTheme(root.dataset.theme === 'dark' ? 'dark' : 'light')
    }

    syncTheme()
    const observer = new MutationObserver(syncTheme)
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })

    return () => {
      observer.disconnect()
    }
  }, [])

  const initialZoom = 12
  const selectedStyles = useMemo(() => {
    const baseStyle = mode === '3d' ? MAP_STYLES['3d'] : MAP_STYLES['2d']
    return {
      light: baseStyle,
      dark: baseStyle,
    }
  }, [mode])

  const focusPlace = useCallback((place) => {
    setActivePlace(place)
    mapRef.current?.flyTo({
      center: [place.lng, place.lat],
      zoom: place.zoom ?? 14,
      duration: 1200,
      pitch: is3D ? 60 : 0,
    })
  }, [is3D])

  const handleResetNorth = useCallback(() => {
    mapRef.current?.easeTo({ bearing: 0, pitch: is3D ? 60 : 0, duration: 400 })
  }, [is3D])

  const rotateBearingBy = useCallback((delta) => {
    const map = mapRef.current
    if (!map) return
    map.easeTo({ bearing: normalizeBearing(map.getBearing() + delta), duration: 180 })
  }, [])

  const handleCompassWheel = useCallback((event) => {
    event.preventDefault()
    rotateBearingBy(event.deltaY > 0 ? 8 : -8)
  }, [rotateBearingBy])

  const endCompassDrag = useCallback((pointerId) => {
    const state = compassDragRef.current
    if (pointerId !== undefined && state.pointerId !== pointerId) return

    state.active = false
    state.pointerId = null
    setIsCompassDragging(false)
  }, [])

  const handleCompassPointerDown = useCallback((event) => {
    if (event.button !== 0 && event.pointerType !== 'touch') return

    const map = mapRef.current
    const button = compassButtonRef.current
    if (!map || !button) return

    const rect = button.getBoundingClientRect()
    const centerX = rect.left + (rect.width / 2)
    const centerY = rect.top + (rect.height / 2)
    const startAngle = getCompassAngle(event.clientX, event.clientY, centerX, centerY)

    compassDragRef.current = {
      active: true,
      moved: false,
      pointerId: event.pointerId,
      centerX,
      centerY,
      startAngle,
      startBearing: normalizeBearing(map.getBearing()),
    }

    setIsCompassDragging(true)
    event.currentTarget.setPointerCapture?.(event.pointerId)
    event.preventDefault()
  }, [])

  const handleCompassPointerMove = useCallback((event) => {
    const state = compassDragRef.current
    if (!state.active || state.pointerId !== event.pointerId) return

    const map = mapRef.current
    if (!map) return

    const currentAngle = getCompassAngle(event.clientX, event.clientY, state.centerX, state.centerY)
    const delta = shortestAngleDelta(state.startAngle, currentAngle)
    const nextBearing = normalizeBearing(state.startBearing + delta)

    if (Math.abs(delta) > 0.8) {
      state.moved = true
    }

    map.stop()
    map.setBearing(nextBearing)
    setBearing(nextBearing)
    event.preventDefault()
  }, [])

  const handleCompassPointerUp = useCallback((event) => {
    const state = compassDragRef.current
    if (state.pointerId !== event.pointerId) return

    event.currentTarget.releasePointerCapture?.(event.pointerId)
    if (state.moved) {
      event.preventDefault()
    }

    endCompassDrag(event.pointerId)
  }, [endCompassDrag])

  const handleCompassPointerCancel = useCallback((event) => {
    endCompassDrag(event.pointerId)
  }, [endCompassDrag])

  const handleCompassClick = useCallback((event) => {
    if (compassDragRef.current.moved) {
      compassDragRef.current.moved = false
      event.preventDefault()
      return
    }

    handleResetNorth()
  }, [handleResetNorth])

  const handleCompassKeyDown = useCallback((event) => {
    if (event.target instanceof HTMLInputElement && event.target.type === 'range') return

    if ((event.shiftKey && event.altKey && event.key === 'ArrowUp') || event.key === 'Home') {
      event.preventDefault()
      handleResetNorth()
      return
    }

    const step = event.shiftKey ? 15 : 5
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault()
      rotateBearingBy(step)
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault()
      rotateBearingBy(-step)
    }
  }, [handleResetNorth, rotateBearingBy])

  const handleZoomIn = useCallback(() => {
    const map = mapRef.current
    if (map) map.zoomTo(map.getZoom() + 1, { duration: 300 })
  }, [])

  const handleZoomOut = useCallback(() => {
    const map = mapRef.current
    if (map) map.zoomTo(map.getZoom() - 1, { duration: 300 })
  }, [])

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation || isLocating) return

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nearby = {
          id: 'current-location',
          name: 'Current Location',
          detail: 'Updated just now',
          eta: 'Now',
          lat: coords.latitude,
          lng: coords.longitude,
          zoom: 14,
          emoji: '📍',
        }
        focusPlace(nearby)
        setDynamicPlaces(prev => [nearby, ...prev.filter(place => place.id !== nearby.id)])
        setIsLocating(false)
      },
      () => {
        setIsLocating(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 9000,
      },
    )
  }, [focusPlace, isLocating])

  return (
    <>
      <div className="window-header">
        <WindowControls target="map" />
        <h2>Maps</h2>
      </div>

      <div className={`map-shell ${is3D ? 'is-3d' : 'is-2d'}`}>
        <aside className="map-sidebar">
          <MapSearch places={allPlaces} onSelect={focusPlace} />

          <div className="map-sidebar-tabs liquid-glass-static map-liquid-surface" role="tablist" aria-label="Maps sidebar view">
            <button
              type="button"
              role="tab"
              aria-selected={panelTab === 'explore'}
              className={`map-sidebar-tab ${panelTab === 'explore' ? 'is-active' : ''}`}
              onClick={() => setPanelTab('explore')}
            >
              Explore
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={panelTab === 'library'}
              className={`map-sidebar-tab ${panelTab === 'library' ? 'is-active' : ''}`}
              onClick={() => setPanelTab('library')}
            >
              Library
            </button>
          </div>

          <div className="map-sidebar-scroll">
            {panelTab === 'explore' ? (
              <>
                <SidebarSection
                  title="Guides Nearby"
                  places={GUIDE_PLACES}
                  activePlaceId={activePlace?.id}
                  onSelect={focusPlace}
                />
                <SidebarSection
                  title="Popular Right Now"
                  places={FEATURED_PLACES}
                  activePlaceId={activePlace?.id}
                  onSelect={focusPlace}
                />
              </>
            ) : (
              <SidebarSection
                title="My Places"
                places={LIBRARY_PLACES}
                activePlaceId={activePlace?.id}
                onSelect={focusPlace}
              />
            )}
          </div>
        </aside>

        <section className="map-stage">
          <div className="map-canvas-wrap">
            <MapCanvas
              ref={mapRef}
              className="map-canvas"
              center={[longitude, latitude]}
              zoom={initialZoom}
              projection="mercator"
              styles={selectedStyles}
              theme={mapTheme}
            >
              {allPlaces.map(place => (
                <MapLocationMarker
                  key={place.id}
                  place={place}
                  active={activePlace?.id === place.id}
                  onSelect={focusPlace}
                />
              ))}
            </MapCanvas>
          </div>

          <div className="map-stage-top">
            <div className="map-mode-switch liquid-glass-static map-liquid-surface" role="group" aria-label="Map mode">
              <button
                type="button"
                className={`map-mode-btn ${mode === '2d' ? 'is-active' : ''}`}
                onClick={() => setMode('2d')}
              >
                2D
              </button>
              <button
                type="button"
                className={`map-mode-btn ${mode === '3d' ? 'is-active' : ''}`}
                onClick={() => setMode('3d')}
              >
                3D
              </button>
            </div>

            <button
              type="button"
              className="map-surface-btn liquid-glass-static map-liquid-surface"
              onClick={handleLocate}
              title="Find my location"
              aria-label="Find my location"
            >
              <LocateIcon loading={isLocating} />
            </button>
          </div>

          <div className="map-right-controls">
            <div
              className={`map-ctrl-btn map-compass-btn map-compass-control mw-compass liquid-glass-static map-liquid-surface ${isCompassDragging ? 'is-dragging' : ''}`}
              onWheel={handleCompassWheel}
              onKeyDown={handleCompassKeyDown}
              tabIndex={0}
              title={`Compass, heading ${headingDegrees} degrees ${heading}`}
              aria-label={`Compass heading ${headingDegrees} degrees ${heading}`}
              aria-keyshortcuts="shift+alt+arrowup"
            >
              <button
                ref={compassButtonRef}
                type="button"
                className="map-compass-action"
                onClick={handleCompassClick}
                onPointerDown={handleCompassPointerDown}
                onPointerMove={handleCompassPointerMove}
                onPointerUp={handleCompassPointerUp}
                onPointerCancel={handleCompassPointerCancel}
                onLostPointerCapture={handleCompassPointerCancel}
                title={`Compass, heading ${headingDegrees} degrees ${heading}. Click to reset north.`}
                aria-label={`Compass, heading ${headingDegrees} degrees ${heading}. Click to reset north.`}
                aria-keyshortcuts="shift+alt+arrowup"
              >
                <CompassIcon bearing={bearing} pitch={pitch} />
              </button>
              <span className="map-compass-heading mw-compass-heading">{heading}</span>
            </div>

            <div className="map-ctrl-group liquid-glass-static map-liquid-surface">
              <button type="button" className="map-ctrl-btn" onClick={handleZoomIn} title="Zoom in">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <button type="button" className="map-ctrl-btn" onClick={handleZoomOut} title="Zoom out">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          </div>

          <ActivePlaceCard place={activePlace} onFocus={focusPlace} />
        </section>
      </div>
    </>
  )
}

const MapWindow = WindowWrapper(MapView, 'map')

export default MapWindow
