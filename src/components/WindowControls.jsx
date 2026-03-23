import React from 'react'
import { useWindowStore } from '#store/window.js'

const WindowControls = ({target}) => {
  const { requestCloseWindow, minimizeWindow, toggleMaximizeWindow } = useWindowStore()
  return (
    <div id="window-controls">
      <div className="close" onClick={() => requestCloseWindow(target)}></div>
      <div className="minimize" onClick={() => minimizeWindow(target)}></div>
      <div className="maximize" onClick={() => toggleMaximizeWindow(target)}></div>
    </div>
  )
}

export default WindowControls