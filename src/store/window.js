import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { INITIAL_Z_INDEX, WINDOW_CONFIG } from '#constants'

export const useWindowStore = create(immer((set) => ({
    windows: WINDOW_CONFIG,
    nextZIndex: INITIAL_Z_INDEX + 1,

    openWindow: (windowKey, data = null) => set((state) => {
        const win = state.windows[windowKey]
        if (!win) return
        win.isOpen = true
        win.isRunning = true
        win.deferClose = false
        win.zIndex = state.nextZIndex
        win.data = data ?? win.data
        state.nextZIndex ++
    }),
    closeWindow: (windowKey) => set((state) => {
        const win = state.windows[windowKey]
        if (!win) return
        win.isOpen = false
        win.isRunning = false
        win.isMaximized = false
        win.deferClose = false
        win.zIndex = INITIAL_Z_INDEX
        win.data = null
    }),
    minimizeWindow: (windowKey) => set((state) => {
        const win = state.windows[windowKey]
        if (!win) return
        win.isOpen = false
        win.isMaximized = false
        win.deferClose = false
    }),
    requestCloseWindow: (windowKey) => set((state) => {
        const win = state.windows[windowKey]
        if (!win) return

        if (win.isOpen && win.isMaximized) {
            win.isMaximized = false
            win.deferClose = true
            win.zIndex = state.nextZIndex++
            return
        }

        win.isOpen = false
        win.isRunning = false
        win.isMaximized = false
        win.deferClose = false
        win.zIndex = INITIAL_Z_INDEX
        win.data = null
    }),
    toggleMaximizeWindow: (windowKey) => set((state) => {
        const win = state.windows[windowKey]
        if (!win || !win.isOpen) return
        win.isMaximized = !win.isMaximized
        win.deferClose = false
        win.zIndex = state.nextZIndex++
    }),
    focusWindow: (windowKey) => set((state) => {
        const win = state.windows[windowKey]
        if (!win || !win.isOpen) return
        win.zIndex = state.nextZIndex++
    }),
})),
)

export default useWindowStore