import { Container, Graphics, Text } from 'pixi.js'
import { GAME_CONFIG, type Difficulty } from '../game/config'
import type { MatchState, MatchStatus } from '../game/state/MatchState'

export class HudView {
  readonly container = new Container()
  private readonly statsText: Text
  private readonly statusText: Text
  private readonly hintText: Text

  constructor() {
    const panel = new Graphics()
    panel
      .roundRect(20, 18, GAME_CONFIG.viewport.width - 40, 78, 10)
      .fill({ color: 0x080d17, alpha: 0.9 })
      .stroke({ color: 0x2c3d63, width: 2 })

    this.statsText = new Text({
      text: '',
      style: {
        fill: GAME_CONFIG.colors.hud,
        fontSize: 20,
        fontFamily: 'Courier New',
        fontWeight: '700'
      }
    })
    this.statsText.position.set(34, 36)

    this.statusText = new Text({
      text: '',
      style: {
        fill: GAME_CONFIG.colors.hud,
        fontSize: 20,
        fontFamily: 'Courier New',
        fontWeight: '700'
      }
    })
    this.statusText.position.set(34, 62)

    this.hintText = new Text({
      text: '',
      style: {
        fill: 0x93a6cf,
        fontSize: 14,
        fontFamily: 'Courier New'
      }
    })
    this.hintText.position.set(GAME_CONFIG.viewport.width - 470, 62)

    this.container.addChild(panel, this.statsText, this.statusText, this.hintText)
  }

  update(matchState: MatchState, status: MatchStatus, activeSignals: number, difficulty: Difficulty): void {
    const target = Math.round(matchState.targetPercent * 100)
    this.statsText.text = [
      `MODE: ${difficulty.toUpperCase()}`,
      `CAUGHT: ${matchState.caught}`,
      `MISSED: ${matchState.missed}`,
      `ACTIVE: ${activeSignals}`,
      `PROGRESS: ${matchState.total}/${matchState.attemptLimit}`,
      `RATIO: ${matchState.caughtPercent.toFixed(1)}% / ${target}%`
    ].join('   ')

    if (status === 'running') {
      this.statusText.style.fill = GAME_CONFIG.colors.hud
      this.statusText.text = 'STATUS: MONITORING TRAFFIC'
    } else if (status === 'won') {
      this.statusText.style.fill = GAME_CONFIG.colors.win
      this.statusText.text = 'STATUS: WIN - 80%+ BYPASS BLOCKED'
    } else {
      this.statusText.style.fill = GAME_CONFIG.colors.lose
      this.statusText.text = 'STATUS: LOSS - TOO MANY SIGNALS PASSED'
    }

    this.hintText.text = 'CLICK SIGNALS | R TO RESTART | 1/2/3 DIFFICULTY'
  }
}
