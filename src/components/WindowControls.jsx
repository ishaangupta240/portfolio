import React from 'react'
import { useWindowStore } from '#store/window.js'

const WindowControls = ({target}) => {
  const { requestCloseWindow, minimizeWindow, toggleMaximizeWindow } = useWindowStore()
  return (
    <div id="window-controls">
      <button
        type="button"
        className="close"
        onClick={() => requestCloseWindow(target)}
        aria-label="Close window"
      >
      </button>

      <button
        type="button"
        className="minimize"
        onClick={() => minimizeWindow(target)}
        aria-label="Minimize window"
      >
      </button>

      <button
        type="button"
        className="maximize"
        onClick={() => toggleMaximizeWindow(target)}
        aria-label="Maximize window"
      >
      </button>
    </div>
  )
}

export default WindowControls