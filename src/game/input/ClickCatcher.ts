import type { SignalIcon } from '../entities/SignalIcon'

export class ClickCatcher {
  bind(signal: SignalIcon, onCatch: () => void): void {
    signal.eventMode = 'static'
    signal.cursor = 'pointer'
    signal.on('pointertap', onCatch)
  }

  unbind(signal: SignalIcon): void {
    signal.removeAllListeners('pointertap')
  }
}
