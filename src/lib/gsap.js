import { gsap } from 'gsap'
import { Draggable } from 'gsap/draggable'

let draggableRegistered = false

export const ensureDraggableRegistered = () => {
  if (!draggableRegistered) {
    gsap.registerPlugin(Draggable)
    draggableRegistered = true
  }

  return { gsap, Draggable }
}

export { gsap, Draggable }
