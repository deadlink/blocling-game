import type { Container } from 'pixi.js'
import type { SignalType } from '../game/config'

export class AudioSystem {
  private context: AudioContext | null = null
  private unlocked = false
  private bgmTimer: number | null = null
  private melodyIndex = 0
  private readonly melody = [220, 247, 262, 294, 262, 247, 196, 220]

  bindUnlock(stage: Container, onUnlock: () => void): void {
    stage.eventMode = 'static'
    stage.once('pointerdown', async () => {
      await this.ensureContext()
      this.unlocked = true
      onUnlock()
    })
  }

  async ensureContext(): Promise<void> {
    if (!this.context) {
      this.context = new AudioContext()
    }
    if (this.context.state === 'suspended') {
      await this.context.resume()
    }
  }

  playSpawnSfx(type: SignalType): void {
    if (!this.unlocked || !this.context) {
      return
    }

    const now = this.context.currentTime
    const osc = this.context.createOscillator()
    const gain = this.context.createGain()
    osc.type = 'triangle'

    const start = type === 'vpn' ? 520 : 460
    const end = type === 'vpn' ? 300 : 260
    osc.frequency.setValueAtTime(start, now)
    osc.frequency.exponentialRampToValueAtTime(end, now + 0.15)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.17, now + 0.025)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16)

    osc.connect(gain)
    gain.connect(this.context.destination)
    osc.start(now)
    osc.stop(now + 0.18)
  }

  startBgm(): void {
    if (!this.unlocked || !this.context || this.bgmTimer !== null) {
      return
    }

    this.bgmTimer = window.setInterval(() => {
      if (!this.context) {
        return
      }

      const now = this.context.currentTime
      const note = this.melody[this.melodyIndex % this.melody.length]
      const osc = this.context.createOscillator()
      const gain = this.context.createGain()

      osc.type = 'square'
      osc.frequency.setValueAtTime(note, now)
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.06, now + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14)

      osc.connect(gain)
      gain.connect(this.context.destination)
      osc.start(now)
      osc.stop(now + 0.15)

      this.melodyIndex += 1
    }, 180)
  }

  stopBgm(): void {
    if (this.bgmTimer === null) {
      return
    }
    window.clearInterval(this.bgmTimer)
    this.bgmTimer = null
  }
}
