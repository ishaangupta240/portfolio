import { gsap } from 'gsap'
import { Draggable } from 'gsap/Draggable'

let draggableRegistered = false

export const ensureDraggableRegistered = () => {
  if (!draggableRegistered) {
    gsap.registerPlugin(Draggable)
    draggableRegistered = true
  }

  return { gsap, Draggable }
}

export { gsap, Draggable }
