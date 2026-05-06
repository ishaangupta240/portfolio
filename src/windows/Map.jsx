import React, { useEffect, useMemo, useRef, useState } from "react"
import WindowWrapper from "#hoc/WindowWrapper"
import WindowControls from "#components/WindowControls"
import { Map as MapCanvas, MapMarker } from "@/components/ui/map"

const THEME_STORAGE_KEY = "portfolio-theme-mode"

const getThemeFromDocument = () => {
  if (typeof document === "undefined") return "light"

  const datasetTheme = document.documentElement.dataset.theme
  if (datasetTheme === "dark" || datasetTheme === "light") return datasetTheme

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (storedTheme === "dark" || storedTheme === "light") return storedTheme
  } catch {
    // Fall back to light when storage isn't available.
  }

  return "light"
}

const PLACES = [
  {
    id: "home",
    name: "Home",
    detail: "Noida, Uttar Pradesh",
    eta: "12 min",
    emoji: "🏠",
    zoom: 13.8,
    lat: 28.57085,
    lng: 77.32593,
  },
  {
    id: "india-gate",
    name: "India Gate",
    detail: "War memorial",
    eta: "26 min",
    emoji: "🏛️",
    zoom: 14.7,
    lat: 28.6129,
    lng: 77.2295,
  },
  {
    id: "qutub",
    name: "Qutub Minar",
    detail: "UNESCO site",
    eta: "31 min",
    emoji: "🕌",
    zoom: 15.1,
    lat: 28.5245,
    lng: 77.1855,
  },
  {
    id: "lotus",
    name: "Lotus Temple",
    detail: "Bahai house of worship",
    eta: "29 min",
    emoji: "🪷",
    zoom: 14.9,
    lat: 28.5535,
    lng: 77.2588,
  },
]

const getPlaceEmoji = (place) => place?.emoji ?? "📍"

function MapApp() {
  const mapRef = useRef(null)
  const [active, setActive] = useState(PLACES[0])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [query, setQuery] = useState("")
  const [tab, setTab] = useState("explore")
  const [mode, setMode] = useState("2d")
  const [bearing, setBearing] = useState(0)
  const [pitch, setPitch] = useState(0)
  const [isLocating, setIsLocating] = useState(false)
  const [mapTheme, setMapTheme] = useState(getThemeFromDocument)
  const [dynamicPlaces, setDynamicPlaces] = useState([])

  const filtered = useMemo(
    () => [...PLACES, ...dynamicPlaces].filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
    [dynamicPlaces, query],
  )

  const allPlaces = useMemo(() => {
    const merged = [...PLACES, ...dynamicPlaces]
    const uniqueById = new Map()
    merged.forEach((place) => {
      uniqueById.set(place.id, place)
    })
    return Array.from(uniqueById.values())
  }, [dynamicPlaces])

  useEffect(() => {
    const root = document.documentElement
    const syncTheme = () => {
      setMapTheme(getThemeFromDocument())
    }

    syncTheme()
    const observer = new MutationObserver(syncTheme)
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let frameId
    let detachListeners

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

      map.on("rotate", update)
      map.on("pitch", update)
      map.on("moveend", update)
      update()

      detachListeners = () => {
        map.off("rotate", update)
        map.off("pitch", update)
        map.off("moveend", update)
      }
    }

    bindListeners()

    return () => {
      if (frameId) cancelAnimationFrame(frameId)
      detachListeners?.()
    }
  }, [])

  const focusPlace = (place) => {
    setActive(place)
    setSidebarOpen(true)
    const map = mapRef.current
    if (!map) return

    map.stop()
    map.flyTo({
      center: [place.lng, place.lat],
      zoom: Math.max(place.zoom ?? 14, 15),
      duration: 1000,
      essential: true,
    })
  }

  const handleModeChange = (nextMode) => {
    setMode(nextMode)
    const map = mapRef.current
    if (!map) return

    const targetPitch = nextMode === "3d" ? 62 : 0
    map.easeTo({ pitch: targetPitch, duration: 640, easing: (t) => t })
  }

  const handleResetNorth = () => {
    const map = mapRef.current
    if (!map) return

    map.stop()
    map.easeTo({ bearing: 0, pitch: mode === "3d" ? 62 : 0, duration: 420 })
  }

  const handleLocate = () => {
    if (!navigator.geolocation || isLocating) return

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const currentLocation = {
          id: "current-location",
          name: "Current Location",
          detail: "Updated just now",
          eta: "Now",
          zoom: 14.5,
          lat: coords.latitude,
          lng: coords.longitude,
        }
        setDynamicPlaces((prev) => [currentLocation, ...prev.filter((place) => place.id !== currentLocation.id)])
        focusPlace(currentLocation)
        setIsLocating(false)
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 9000 },
    )
  }

  const visiblePlaces = query
    ? filtered
    : tab === "library"
      ? allPlaces.slice(0, 3)
      : allPlaces

  return (
    <>
      <div className="window-header">
        <WindowControls target="map" />
        <h2>Maps</h2>
      </div>

      <div className="map-root">
        <MapCanvas
          ref={mapRef}
          center={[77.2, 28.6]}
          zoom={10}
          className="map-canvas"
          theme={mapTheme}
          pitch={mode === "3d" ? 62 : 0}
          maxPitch={75}
        >
          {allPlaces.map((place) => (
            <MapMarker
              key={place.id}
              latitude={place.lat}
              longitude={place.lng}
              onClick={() => focusPlace(place)}
            >
              <div className={`map-marker ${active?.id === place.id ? "active" : ""} ${place.id === "current-location" ? "is-current" : ""}`}>
                <div className="map-marker-bubble">
                  <span className="map-marker-icon" aria-hidden="true">
                    {getPlaceEmoji(place)}
                  </span>
                </div>
                <div className="map-marker-label">{place.name}</div>
              </div>
            </MapMarker>
          ))}
        </MapCanvas>

        <div className="map-search">
          <div className="map-search-pill">
            <input
              placeholder="Search Maps"
              aria-label="Search places"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSidebarOpen(true)}
            />
            <button
              type="button"
              className="map-search-action"
              onClick={() => active && focusPlace(active)}
              aria-label="Center on selected place"
              title="Center on selected place"
            >
              􀊫
            </button>
          </div>
        </div>

        <aside className={`map-sidepanel ${sidebarOpen ? "open" : "closed"}`}>
          <button
            type="button"
            className="map-sidepanel-toggle"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {sidebarOpen ? "􀆉" : "􀆊"}
          </button>

          <div className="map-sidepanel-inner">
            <div className="panel-tabs" role="tablist" aria-label="Map view tabs">
              <button
                type="button"
                className={`panel-tab ${tab === "explore" ? "active" : ""}`}
                onClick={() => setTab("explore")}
              >
                Explore
              </button>
              <button
                type="button"
                className={`panel-tab ${tab === "library" ? "active" : ""}`}
                onClick={() => setTab("library")}
              >
                Library
              </button>
            </div>

            <div className="panel-content">
              {visiblePlaces.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  aria-pressed={active?.id === place.id}
                  className={`panel-item ${active?.id === place.id ? "active" : ""}`}
                  onClick={() => focusPlace(place)}
                >
                  <div className="panel-item-leading" aria-hidden="true">{getPlaceEmoji(place)}</div>
                  <div className="panel-item-copy">
                    <div className="panel-title">{place.name}</div>
                    <div className="panel-sub">{place.detail}</div>
                  </div>
                  <div className="panel-time">{place.eta}</div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="map-controls">
          <div className="map-control-pill-group">
            <button
              type="button"
              className={`map-control-pill ${mode === "2d" ? "active" : ""}`}
              onClick={() => handleModeChange("2d")}
              aria-pressed={mode === "2d"}
              title="2D view"
            >
              2D
            </button>
            <button
              type="button"
              className={`map-control-pill ${mode === "3d" ? "active" : ""}`}
              onClick={() => handleModeChange("3d")}
              aria-pressed={mode === "3d"}
              title="3D view"
            >
              3D
            </button>
          </div>

          <button
            type="button"
            className="map-control-pill map-control-pill-icon"
            onClick={handleLocate}
            title="Current location"
            aria-label="Current location"
          >
            <span className="map-control-symbol" aria-hidden="true">{isLocating ? "􀘭" : "􀋒"}</span>
          </button>

          <button
            type="button"
            className="map-control-pill map-control-pill-icon map-compass-btn"
            onClick={handleResetNorth}
            title={`Compass, heading ${Math.round(bearing)} degrees`}
            aria-label={`Compass, heading ${Math.round(bearing)} degrees`}
          >
            <span
              className="map-compass-arrow"
              style={{ transform: `rotate(${-bearing}deg)` }}
              aria-hidden="true"
            >
              􀙋
            </span>
          </button>
        </div>

        {active && (
          <div className="map-card">
            <div>
              <div className="card-title">{active.name}</div>
              <div className="card-sub">{active.detail}</div>
            </div>
            <button type="button" onClick={() => focusPlace(active)} aria-label={`Center map on ${active.name}`} title={`Center map on ${active.name}`}>􀙟</button>
          </div>
        )}
      </div>
    </>
  )
}

const MapWindow = WindowWrapper(MapApp, "map")

export default MapWindow