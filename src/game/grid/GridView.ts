import { Container, Graphics } from 'pixi.js'
import { GAME_CONFIG } from '../config'
import type { NetworkGraph } from '../network/NetworkGraph'

export class GridView {
  readonly container = new Container()

  constructor(network: NetworkGraph) {
    this.drawApartments()
    this.drawCables(network)
    this.drawRouters(network)
  }

  private drawApartments(): void {
    const { cols, rows, cellWidth, cellHeight, originX, originY } = GAME_CONFIG.grid
    const apartmentWidth = 92
    const apartmentHeight = 72

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const centerX = originX + col * cellWidth
        const centerY = originY + row * cellHeight

        const apartment = new Graphics()
        apartment
          .roundRect(
            centerX - apartmentWidth * 0.5,
            centerY - apartmentHeight * 0.5,
            apartmentWidth,
            apartmentHeight,
            6
          )
          .fill(GAME_CONFIG.colors.apartment)
          .stroke({ color: GAME_CONFIG.colors.apartmentBorder, width: 2 })

        apartment
          .rect(centerX - 24, centerY + 4, 48, 12)
          .fill(GAME_CONFIG.colors.desk)
          .rect(centerX - 11, centerY - 5, 22, 12)
          .fill(GAME_CONFIG.colors.computer)
          .rect(centerX - 6, centerY - 20, 12, 12)
          .fill(GAME_CONFIG.colors.resident)

        this.container.addChild(apartment)
      }
    }
  }

  private drawCables(network: NetworkGraph): void {
    const layer = new Graphics()
    for (const segment of network.getCableSegments()) {
      layer
        .moveTo(segment.from.x, segment.from.y)
        .lineTo(segment.to.x, segment.to.y)
        .stroke({ color: GAME_CONFIG.colors.cable, width: 2 })
    }
    this.container.addChild(layer)
  }

  private drawRouters(network: NetworkGraph): void {
    const layer = new Graphics()
    for (const router of network.getRouterPositions()) {
      layer
        .circle(router.x, router.y, 9)
        .fill(GAME_CONFIG.colors.router)
        .circle(router.x, router.y, 3)
        .fill(GAME_CONFIG.colors.routerCore)
    }
    this.container.addChild(layer)
  }
}
