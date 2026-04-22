import type { Container } from 'pixi.js'
import type { SignalType } from '../game/config'
import { BGM_LOOP_URL } from '../game/assetPaths'

export class AudioSystem {
  private context: AudioContext | null = null
  private unlocked = false
  private bgmAudio: HTMLAudioElement | null = null

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

    const start =
      type === 'vpn' ? 520 : type === 'youtube' ? 620 : type === 'telegram' ? 560 : type === 'x' ? 680 : 420
    const end =
      type === 'vpn' ? 300 : type === 'youtube' ? 360 : type === 'telegram' ? 320 : type === 'x' ? 410 : 250
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

  playCaughtSfx(): void {
    if (!this.unlocked || !this.context) {
      return
    }

    const now = this.context.currentTime
    const osc = this.context.createOscillator()
    const gain = this.context.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(820, now)
    osc.frequency.exponentialRampToValueAtTime(1280, now + 0.08)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1)
    osc.connect(gain)
    gain.connect(this.context.destination)
    osc.start(now)
    osc.stop(now + 0.11)
  }

  playMissedSfx(): void {
    if (!this.unlocked || !this.context) {
      return
    }

    const now = this.context.currentTime
    const osc = this.context.createOscillator()
    const gain = this.context.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(240, now)
    osc.frequency.exponentialRampToValueAtTime(92, now + 0.32)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.13, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.33)
    osc.connect(gain)
    gain.connect(this.context.destination)
    osc.start(now)
    osc.stop(now + 0.34)
  }

  playRouterHitSfx(): void {
    if (!this.unlocked || !this.context) {
      return
    }

    const now = this.context.currentTime
    const osc = this.context.createOscillator()
    const gain = this.context.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(980, now)
    osc.frequency.exponentialRampToValueAtTime(210, now + 0.085)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.006)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.095)
    osc.connect(gain)
    gain.connect(this.context.destination)
    osc.start(now)
    osc.stop(now + 0.1)
  }

  startBgm(): void {
    if (!this.unlocked) {
      return
    }
    if (!this.bgmAudio) {
      this.bgmAudio = new Audio(BGM_LOOP_URL)
      this.bgmAudio.loop = true
      this.bgmAudio.volume = 0.45
      this.bgmAudio.preload = 'auto'
    }
    if (!this.bgmAudio.paused) {
      return
    }
    void this.bgmAudio.play()
  }

  stopBgm(): void {
    if (!this.bgmAudio) {
      return
    }
    this.bgmAudio.pause()
    this.bgmAudio.currentTime = 0
  }
}
