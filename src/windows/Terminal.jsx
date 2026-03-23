import React from 'react'
import WindowWrapper from '#hoc/WindowWrapper'
import WindowControls from '#components/WindowControls'

const Terminal = () => {
  return (
    <>
    <div id="window-header">
        <WindowControls target="terminal"/>
        <h2>Tech Stack</h2>
    </div>
    <div className="techstack">
        <p>
            <span className="font-bold">@ishaan %</span>
            show tech stack
        </p>
    </div>
    </>
  )
}

const TerminalWindow = WindowWrapper(Terminal, 'terminal')

export default TerminalWindow