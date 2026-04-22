import { Container, Graphics, Text } from 'pixi.js'
import { GAME_CONFIG, type SignalType } from '../config'
import type { Vec2 } from '../network/NetworkGraph'

export class SignalIcon extends Container {
  readonly signalType: SignalType
  private readonly path: Vec2[]
  private readonly speed: number
  private segmentIndex = 0
  private animTime = 0
  private readonly glow?: Graphics

  constructor(signalType: SignalType, path: Vec2[], speed: number) {
    super()
    this.signalType = signalType
    this.path = path
    this.speed = speed

    const color =
      signalType === 'vpn'
        ? GAME_CONFIG.colors.vpn
        : signalType === 'youtube'
          ? GAME_CONFIG.colors.youtube
          : signalType === 'telegram'
            ? GAME_CONFIG.colors.telegram
            : signalType === 'x'
              ? GAME_CONFIG.colors.x
              : GAME_CONFIG.colors.pornhub
    const isRoundSocial = signalType !== 'vpn'
    const strokeWidth = 1.2

    if (!isRoundSocial) {
      this.glow = new Graphics()
      this.glow.roundRect(-42, -24, 84, 48, 8).fill({ color, alpha: 0.12 })
    }

    const body = new Graphics()
    if (!isRoundSocial) {
      body.roundRect(-40, -22, 80, 44, 6).fill(0x111a28).stroke({ color, width: strokeWidth })
    } else {
      body.roundRect(-40, -22, 80, 44, 6).fill(0xffffff).stroke({ color, width: strokeWidth })
    }

    const symbol =
      signalType === 'vpn'
        ? this.createVpnLabel()
        : signalType === 'youtube'
          ? this.createYoutubeIcon()
          : signalType === 'telegram'
            ? this.createTelegramIcon()
            : signalType === 'x'
              ? this.createXIcon()
              : this.createPornhubIcon()
    if (!isRoundSocial && this.glow) {
      this.addChild(this.glow, body, symbol)
    } else {
      this.addChild(body, symbol)
    }
    this.position.set(path[0].x, path[0].y)
  }

  update(deltaSec: number): boolean {
    this.animTime += deltaSec
    this.scale.set(1)
    if (this.glow) {
      this.glow.alpha = 0.28
    }

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

  private createYoutubeIcon(): Container {
    const container = new Container()
    const logo = new Graphics()
    logo
      .roundRect(-16, -10, 32, 20, 6)
      .fill(0xff0000)
      .poly([
        { x: -4, y: -5 },
        { x: -4, y: 5 },
        { x: 6, y: 0 }
      ])
      .fill(0xffffff)
    container.addChild(logo)
    return container
  }

  private createTelegramIcon(): Container {
    const container = new Container()
    const logo = new Graphics()
    logo
      .circle(0, 0, 14)
      .fill(0x26a5e4)
      .poly([
        { x: -6.5, y: 0 },
        { x: 7.5, y: -5.5 },
        { x: -1.5, y: 8.5 },
        { x: -1.2, y: 2.4 }
      ])
      .fill(0xffffff)
      .poly([
        { x: -1.2, y: 2.4 },
        { x: 1.3, y: 7.2 },
        { x: 3.8, y: 3.4 }
      ])
      .fill(0xd8f2ff)
    container.addChild(logo)
    return container
  }

  private createXIcon(): Container {
    const container = new Container()
    const text = new Text({
      text: 'X',
      style: {
        fontFamily: 'Arial Black',
        fontSize: 28,
        fontWeight: '900',
        fill: 0x111111
      }
    })
    text.anchor.set(0.5)
    text.y = -1
    container.addChild(text)
    return container
  }

  private createPornhubIcon(): Container {
    const container = new Container()
    const textPorn = new Text({
      text: 'PORN',
      style: {
        fontFamily: 'Arial',
        fontSize: 11,
        fontWeight: '700',
        fill: 0x111111
      }
    })
    textPorn.anchor.set(1, 0.5)
    textPorn.x = -1

    const badge = new Graphics()
    badge.roundRect(1, -7, 20, 14, 3).fill(0xff9800)

    const textHub = new Text({
      text: 'HUB',
      style: {
        fontFamily: 'Arial Black',
        fontSize: 8,
        fontWeight: '900',
        fill: 0x000000
      }
    })
    textHub.anchor.set(0.5)
    textHub.position.set(11, 0.3)

    container.addChild(textPorn, badge, textHub)
    return container
  }
}
