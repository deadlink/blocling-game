export type MatchStatus = 'running'

export class MatchState {
  private static readonly LEVEL_SCORE_STEP = 100
  score = 0
  level = 1
  total = 0
  caught = 0
  missed = 0

  constructor() {}

  registerSpawn(): void {
    this.total += 1
  }

  registerCaught(): void {
    this.caught += 1
  }

  registerMissed(): void {
    this.missed += 1
  }

  addScore(value: number): void {
    this.score = Math.max(0, this.score + value)
  }

  maybeLevelUp(): boolean {
    const threshold = this.level * MatchState.LEVEL_SCORE_STEP
    if (this.score >= threshold) {
      this.level += 1
      return true
    }
    return false
  }

  get nextLevelScore(): number {
    return this.level * MatchState.LEVEL_SCORE_STEP
  }

  get progressToNextLevel(): number {
    const previousThreshold = (this.level - 1) * MatchState.LEVEL_SCORE_STEP
    const span = MatchState.LEVEL_SCORE_STEP
    return Math.max(0, Math.min(1, (this.score - previousThreshold) / span))
  }

  resolveStatus(): MatchStatus {
    return 'running'
  }
}
