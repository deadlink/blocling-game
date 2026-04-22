import { Container, Graphics, Text } from 'pixi.js'
import { GAME_CONFIG, type SignalType } from '../config'
import type { Vec2 } from '../network/NetworkGraph'

export class SignalIcon extends Container {
  readonly signalType: SignalType
  private readonly path: Vec2[]
  private readonly speed: number
  private segmentIndex = 0
  private animTime = 0
  private readonly glow: Graphics

  constructor(signalType: SignalType, path: Vec2[], speed: number) {
    super()
    this.signalType = signalType
    this.path = path
    this.speed = speed

    const color =
      signalType === 'vpn'
        ? GAME_CONFIG.colors.vpn
        : GAME_CONFIG.colors.proxy
    const strokeWidth = 1.2

    this.glow = new Graphics()
    this.glow.roundRect(-42, -24, 84, 48, 8).fill({ color, alpha: 0.12 })

    const body = new Graphics()
    body
      .roundRect(-40, -22, 80, 44, 6)
      .fill(0x111a28)
      .stroke({ color, width: strokeWidth })

    const symbol = signalType === 'vpn' ? this.createVpnLabel() : this.createProxyLabel()
    this.addChild(this.glow, body, symbol)
    this.position.set(path[0].x, path[0].y)
  }

  update(deltaSec: number): boolean {
    this.animTime += deltaSec
    this.scale.set(1 + Math.sin(this.animTime * 8) * 0.04)
    this.glow.alpha = 0.18 + Math.max(0, Math.sin(this.animTime * 9)) * 0.22

    let budget = this.speed * deltaSec
    while (budget > 0 && this.segmentIndex < this.path.length - 1) {
      const to = this.path[this.segmentIndex + 1]
      const dx = to.x - this.x
      const dy = to.y - this.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < 0.1) {
        this.segmentIndex += 1
        this.position.set(to.x, to.y)
        continue
      }
      const step = Math.min(distance, budget)
      this.position.set(this.x + (dx / distance) * step, this.y + (dy / distance) * step)
      budget -= step
      if (step >= distance - 0.1) {
        this.segmentIndex += 1
        this.position.set(to.x, to.y)
      }
    }
    return this.segmentIndex >= this.path.length - 1
  }

  private createVpnLabel(): Text {
    const text = new Text({
      text: 'VPN',
      style: {
        fontFamily: 'Courier New',
        fontSize: 18,
        fontWeight: '700',
        fill: 0x66f2ff,
        letterSpacing: 1.4
      }
    })
    text.anchor.set(0.5)
    text.y = 0.8
    return text
  }

  private createProxyLabel(): Text {
    const text = new Text({
      text: 'PROXY',
      style: {
        fontFamily: 'Courier New',
        fontSize: 13,
        fontWeight: '700',
        fill: 0xffd380,
        letterSpacing: 1.1
      }
    })
    text.anchor.set(0.5)
    text.y = 0.8
    return text
  }
}
