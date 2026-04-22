import { Container, Graphics } from 'pixi.js'
import { GAME_CONFIG } from '../config'
import type { NetworkGraph, Vec2 } from '../network/NetworkGraph'

type RouterAnim = {
  leds: Graphics
  phase: number
  alertTimer: number
}

export class GridView {
  readonly container = new Container()
  readonly routerOverlay = new Container()
  private readonly windows: Array<{
    hasVisibleMonitor: boolean
    monitor: Graphics
    phase: number
  }> = []
  private readonly routers = new Map<string, RouterAnim>()
  private readonly connectionPaths: Vec2[][]
  private readonly flowLayer = new Graphics()
  private flowPhase = 0

  constructor(network: NetworkGraph) {
    this.connectionPaths = network
      .getApartmentConnectionPaths()
      .map((item) => item.path)
      .filter((path) => path.length > 1)

    this.drawBuildingFacade()
    this.drawConnections()
    this.drawWindows(network)
    this.drawRouters(network)
    this.container.addChild(this.flowLayer)
    this.renderFlowDashes()
  }

  update(deltaSec: number): void {
    for (const window of this.windows) {
      if (!window.hasVisibleMonitor) {
        continue
      }
      window.phase += deltaSec * 6
      const flicker = 0.28 + Math.max(0, Math.sin(window.phase * 1.7)) * 0.72
      window.monitor.alpha = flicker
    }

    for (const router of this.routers.values()) {
      router.phase += deltaSec * 8
      if (router.alertTimer > 0) {
        router.alertTimer = Math.max(0, router.alertTimer - deltaSec)
      }

      const pulse = 0.35 + Math.max(0, Math.sin(router.phase)) * 0.65
      if (router.alertTimer > 0) {
        router.leds.tint = 0xff4e4e
        router.leds.alpha = 0.45 + pulse * 0.55
      } else {
        router.leds.tint = 0x6dff85
        router.leds.alpha = 0.4 + pulse * 0.5
      }
    }

    this.flowPhase += deltaSec * 120
    this.renderFlowDashes()
  }

  markRouterAlert(routerId: string): void {
    const router = this.routers.get(routerId)
    if (!router) {
      return
    }
    router.alertTimer = 0.9
  }

  private drawBuildingFacade(): void {
    const { cols, rows, cellWidth, cellHeight, originX, originY } = GAME_CONFIG.grid
    const left = originX - cellWidth * 0.6
    const top = originY - cellHeight * 0.55
    const width = (cols - 1) * cellWidth + cellWidth * 1.2
    const height = (rows - 1) * cellHeight + cellHeight * 1.1

    const facade = new Graphics()
    facade
      .rect(left, top, width, height)
      .fill(0x5a2f26)
      .stroke({ color: 0x341914, width: 6 })

    const brick = new Graphics()
    const brickW = 36
    const brickH = 16
    const gutter = 2
    const rowsCount = Math.floor(height / (brickH + gutter))
    const colsCount = Math.floor(width / (brickW + gutter))

    for (let r = 0; r < rowsCount; r += 1) {
      const offset = r % 2 === 0 ? 0 : Math.floor(brickW * 0.5)
      for (let c = 0; c < colsCount + 1; c += 1) {
        const x = left + c * (brickW + gutter) - offset
        const y = top + r * (brickH + gutter)
        const color = (r + c) % 2 === 0 ? 0x6a392e : 0x743e33
        brick.rect(x, y, brickW, brickH).fill(color)
      }
    }

    this.container.addChild(facade, brick)
  }

  private drawConnections(): void {
    const shadow = new Graphics()
    const core = new Graphics()
    const highlight = new Graphics()

    for (const path of this.connectionPaths) {
      for (let i = 0; i < path.length - 1; i += 1) {
        const from = path[i]
        const to = path[i + 1]
        shadow
          .moveTo(from.x, from.y)
          .lineTo(to.x, to.y)
          .stroke({ color: 0x0b0d13, width: 8, cap: 'round', join: 'round' })
        core
          .moveTo(from.x, from.y)
          .lineTo(to.x, to.y)
          .stroke({ color: 0x4a4f5c, width: 5, cap: 'round', join: 'round' })
        highlight
          .moveTo(from.x - 0.7, from.y - 0.7)
          .lineTo(to.x - 0.7, to.y - 0.7)
          .stroke({ color: 0x737985, width: 1.1, cap: 'round', join: 'round' })
      }
    }

    this.container.addChild(shadow, core, highlight)
  }

  private drawWindows(network: NetworkGraph): void {
    for (const apartmentId of network.getApartmentIds()) {
      const center = network.getNodePosition(apartmentId)
      const hasCurtain = Math.random() > 0.45

      const frame = new Graphics()
      frame
        .roundRect(center.x - 112, center.y - 84, 224, 168, 8)
        .fill(0x1d1614)
        .stroke({ color: 0x8a6a52, width: 8 })

      const roomBack = new Graphics()
      roomBack.rect(center.x - 95, center.y - 67, 190, 134).fill(0x121827)

      const monitor = new Graphics()
      if (hasCurtain) {
        const rod = new Graphics()
        rod
          .rect(center.x - 98, center.y - 72, 196, 6)
          .fill(0x6f5a4a)
          .rect(center.x - 102, center.y - 72, 4, 6)
          .fill(0x8d7461)
          .rect(center.x + 98, center.y - 72, 4, 6)
          .fill(0x8d7461)

        const curtains = new Graphics()
        curtains
          // left panel (wider at top, tapered down)
          .poly([
            { x: center.x - 95, y: center.y - 66 },
            { x: center.x - 8, y: center.y - 66 },
            { x: center.x - 28, y: center.y + 67 },
            { x: center.x - 95, y: center.y + 67 }
          ])
          .fill(0x7f5c73)
          // right panel
          .poly([
            { x: center.x + 8, y: center.y - 66 },
            { x: center.x + 95, y: center.y - 66 },
            { x: center.x + 95, y: center.y + 67 },
            { x: center.x + 28, y: center.y + 67 }
          ])
          .fill(0x6f4f67)

        const folds = new Graphics()
        // left folds
        folds
          .poly([
            { x: center.x - 81, y: center.y - 66 },
            { x: center.x - 70, y: center.y - 66 },
            { x: center.x - 78, y: center.y + 64 },
            { x: center.x - 88, y: center.y + 64 }
          ])
          .fill(0x5f4458)
          .poly([
            { x: center.x - 60, y: center.y - 66 },
            { x: center.x - 50, y: center.y - 66 },
            { x: center.x - 56, y: center.y + 64 },
            { x: center.x - 66, y: center.y + 64 }
          ])
          .fill(0x5f4458)
          .poly([
            { x: center.x - 38, y: center.y - 66 },
            { x: center.x - 29, y: center.y - 66 },
            { x: center.x - 34, y: center.y + 64 },
            { x: center.x - 43, y: center.y + 64 }
          ])
          .fill(0x5f4458)
          // right folds
          .poly([
            { x: center.x + 70, y: center.y - 66 },
            { x: center.x + 81, y: center.y - 66 },
            { x: center.x + 88, y: center.y + 64 },
            { x: center.x + 78, y: center.y + 64 }
          ])
          .fill(0x5a4154)
          .poly([
            { x: center.x + 50, y: center.y - 66 },
            { x: center.x + 60, y: center.y - 66 },
            { x: center.x + 66, y: center.y + 64 },
            { x: center.x + 56, y: center.y + 64 }
          ])
          .fill(0x5a4154)
          .poly([
            { x: center.x + 29, y: center.y - 66 },
            { x: center.x + 38, y: center.y - 66 },
            { x: center.x + 43, y: center.y + 64 },
            { x: center.x + 34, y: center.y + 64 }
          ])
          .fill(0x5a4154)

        const tiebacks = new Graphics()
        tiebacks
          .rect(center.x - 44, center.y + 4, 18, 4)
          .fill(0x9d7f5f)
          .rect(center.x + 26, center.y + 4, 18, 4)
          .fill(0x9d7f5f)

        this.container.addChild(frame, roomBack, rod, curtains, folds, tiebacks)
      } else {
        const silhouette = new Graphics()
        silhouette
          .rect(center.x - 26, center.y - 14, 52, 36)
          .fill(0x0e1015)
          .rect(center.x - 14, center.y + 22, 28, 8)
          .fill(0x0e1015)
          .rect(center.x - 7, center.y + 30, 14, 6)
          .fill(0x0e1015)
          .ellipse(center.x, center.y + 52, 16, 8)
          .fill(0x0e1015)
        monitor.rect(center.x - 21, center.y - 9, 42, 26).fill(0x7ff3ff)
        this.container.addChild(frame, roomBack, silhouette, monitor)
      }

      const glass = new Graphics()
      glass.rect(center.x - 95, center.y - 67, 190, 134).fill({ color: 0x7ec8ff, alpha: 0.28 })
      this.container.addChild(glass)

      this.windows.push({
        hasVisibleMonitor: !hasCurtain,
        monitor,
        phase: Math.random() * Math.PI * 2
      })
    }
  }

  private drawRouters(network: NetworkGraph): void {
    for (const router of network.getRouterNodes()) {
      const shell = new Graphics()
      shell
        .roundRect(router.position.x - 24, router.position.y - 24, 48, 48, 4)
        .fill(0x2d3450)
        .stroke({ color: 0x101627, width: 3 })
        .rect(router.position.x - 15, router.position.y - 15, 30, 12)
        .fill(0x586a8f)

      const leds = new Graphics()
      leds
        .rect(router.position.x - 11, router.position.y + 10, 6, 6)
        .fill(0x6dff85)
        .rect(router.position.x - 3, router.position.y + 10, 6, 6)
        .fill(0x6dff85)
        .rect(router.position.x + 5, router.position.y + 10, 6, 6)
        .fill(0x6dff85)
      leds.alpha = 0.65

      this.routerOverlay.addChild(shell, leds)
      this.routers.set(router.id, {
        leds,
        phase: Math.random() * Math.PI * 2,
        alertTimer: 0
      })
    }
  }

  private renderFlowDashes(): void {
    const dashLength = 8
    const gapLength = 12
    const cycle = dashLength + gapLength
    const offset = this.flowPhase % cycle

    this.flowLayer.clear()
    for (const path of this.connectionPaths) {
      for (let i = 0; i < path.length - 1; i += 1) {
        this.drawFlowSegment(path[i], path[i + 1], offset, dashLength, cycle)
      }
    }
  }

  private drawFlowSegment(from: Vec2, to: Vec2, offset: number, dashLength: number, cycle: number): void {
    const dx = to.x - from.x
    const dy = to.y - from.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance < 1) {
      return
    }

    let cursor = -offset
    while (cursor < distance) {
      const start = Math.max(0, cursor)
      const end = Math.min(distance, cursor + dashLength)
      if (end > start) {
        const sx = from.x + (dx * start) / distance
        const sy = from.y + (dy * start) / distance
        const ex = from.x + (dx * end) / distance
        const ey = from.y + (dy * end) / distance
        this.flowLayer
          .moveTo(sx, sy)
          .lineTo(ex, ey)
          .stroke({ color: 0xf1f5ff, width: 1.7, cap: 'round', join: 'round' })
      }
      cursor += cycle
    }
  }
}
