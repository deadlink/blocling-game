import { Container, Graphics, Text } from 'pixi.js'
import { GAME_CONFIG, type Difficulty } from '../game/config'
import type { MatchState } from '../game/state/MatchState'

export class HudView {
  readonly container = new Container()
  private readonly statsText: Text
  private readonly statusText: Text
  private readonly hintText: Text
  private readonly scoreText: Text
  private readonly levelText: Text
  private readonly progressBar: Graphics

  constructor() {
    const sidebarWidth = 340
    const sidebarHeight = GAME_CONFIG.viewport.height - 40

    const leftPanel = new Graphics()
    leftPanel
      .rect(6, 20, sidebarWidth, sidebarHeight)
      .fill({ color: 0x000000, alpha: 0.98 })
      .rect(12, 26, sidebarWidth - 12, 44)
      .fill(0x000000)

    const rightPanel = new Graphics()
    rightPanel
      .rect(GAME_CONFIG.viewport.width - sidebarWidth - 6, 20, sidebarWidth, sidebarHeight)
      .fill({ color: 0x000000, alpha: 0.98 })
      .rect(GAME_CONFIG.viewport.width - sidebarWidth, 26, sidebarWidth - 12, 44)
      .fill(0x000000)

    this.statsText = new Text({
      text: '',
      style: {
        fill: 0xffffff,
        fontSize: 18,
        fontFamily: 'monospace',
        fontWeight: '700',
        letterSpacing: 1.4,
        lineHeight: 30
      }
    })
    this.statsText.position.set(16, 90)

    this.statusText = new Text({
      text: '',
      style: {
        fill: 0xffffff,
        fontSize: 24,
        fontFamily: 'monospace',
        fontWeight: '700',
        letterSpacing: 2.2
      }
    })
    this.statusText.position.set(24, 35)

    this.hintText = new Text({
      text: '',
      style: {
        fill: 0xffffff,
        fontSize: 16,
        fontFamily: 'monospace',
        fontWeight: '700',
        lineHeight: 28
      }
    })
    this.hintText.position.set(16, 380)

    this.scoreText = new Text({
      text: '',
      style: {
        fill: 0xffffff,
        fontSize: 25,
        fontFamily: 'monospace',
        fontWeight: '700',
        letterSpacing: 2.2,
        lineHeight: 38
      }
    })
    this.scoreText.position.set(GAME_CONFIG.viewport.width - 336, 90)

    this.levelText = new Text({
      text: '',
      style: {
        fill: 0xffffff,
        fontSize: 18,
        fontFamily: 'monospace',
        fontWeight: '700',
        letterSpacing: 1.4,
        lineHeight: 30
      }
    })
    this.levelText.position.set(GAME_CONFIG.viewport.width - 336, 380)

    this.progressBar = new Graphics()

    this.container.addChild(
      leftPanel,
      rightPanel,
      this.statsText,
      this.statusText,
      this.hintText,
      this.scoreText,
      this.levelText,
      this.progressBar
    )
  }

  update(matchState: MatchState, activeSignals: number, difficulty: Difficulty): void {
    this.statsText.text = [
      `MODE`,
      `${difficulty.toUpperCase()}`,
      `LEVEL`,
      `${matchState.level}`,
      `ACTIVE`,
      `${activeSignals}`,
      `CAUGHT`,
      `${matchState.caught}`,
      `MISSED`,
      `${matchState.missed}`
    ].join('\n')

    this.statusText.text = 'NET DEF'

    this.hintText.text = ['VPN +10', 'PROXY +5', 'YT/TG -2', 'ROUTER x5'].join('\n')

    this.scoreText.text = ['SCORE', `${Math.floor(matchState.score)}`].join('\n')
    this.levelText.text = ['NEXT', `${matchState.nextLevelScore}`, 'PROGRESS'].join('\n')

    const barX = GAME_CONFIG.viewport.width - 336
    const barY = 520
    const barW = 146
    const progress = matchState.progressToNextLevel
    this.progressBar.clear()
    this.progressBar
      .rect(barX, barY, barW, 14)
      .fill(0x000000)
      .rect(barX + 2, barY + 2, (barW - 4) * progress, 10)
      .fill(0xffffff)
  }
}
