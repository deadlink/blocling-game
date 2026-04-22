import { Circle } from 'pixi.js'
import type { SignalIcon } from '../entities/SignalIcon'

export class ClickCatcher {
  bind(signal: SignalIcon, onCatch: () => void): void {
    signal.eventMode = 'static'
    signal.cursor = 'pointer'
    signal.hitArea = new Circle(0, 0, 31)
    signal.on('pointertap', onCatch)
  }

  unbind(signal: SignalIcon): void {
    signal.hitArea = null
    signal.removeAllListeners('pointertap')
  }
}
