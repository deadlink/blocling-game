import { Container, Graphics, Text } from 'pixi.js'
import { GAME_CONFIG, type SignalType } from '../config'
import type { Vec2 } from '../network/NetworkGraph'

export class SignalIcon extends Container {
  readonly signalType: SignalType
  private readonly path: Vec2[]
  private readonly speed: number
  private segmentIndex = 0

  constructor(signalType: SignalType, path: Vec2[], speed: number) {
    super()
    this.signalType = signalType
    this.path = path
    this.speed = speed

    const color = signalType === 'vpn' ? GAME_CONFIG.colors.vpn : GAME_CONFIG.colors.proxy
    const circle = new Graphics()
    circle
      .circle(0, 0, 10)
      .fill(color)
      .stroke({ color: 0x121212, width: 2 })

    const marker = new Text({
      text: signalType === 'vpn' ? 'V' : 'P',
      style: {
        fill: 0x0f1118,
        fontSize: 10,
        fontFamily: 'Courier New',
        fontWeight: '700'
      }
    })
    marker.anchor.set(0.5)

    this.addChild(circle, marker)
    this.position.set(path[0].x, path[0].y)
  }

  update(deltaSec: number): boolean {
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
}
