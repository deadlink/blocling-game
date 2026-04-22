export type MatchStatus = 'running' | 'won' | 'lost'

export class MatchState {
  readonly targetPercent: number
  readonly attemptLimit: number
  total = 0
  caught = 0
  missed = 0

  constructor(targetPercent: number, attemptLimit: number) {
    this.targetPercent = targetPercent
    this.attemptLimit = attemptLimit
  }

  get caughtRatio(): number {
    if (this.total === 0) {
      return 1
    }
    return this.caught / this.total
  }

  get caughtPercent(): number {
    return this.caughtRatio * 100
  }

  registerSpawn(): void {
    this.total += 1
  }

  registerCaught(): void {
    this.caught += 1
  }

  registerMissed(): void {
    this.missed += 1
  }

  resolveStatus(activeSignals: number): MatchStatus {
    const maxPossibleCaught = this.caught + (this.attemptLimit - this.total)
    const maxPossibleRatio = maxPossibleCaught / this.attemptLimit

    if (maxPossibleRatio < this.targetPercent) {
      return 'lost'
    }

    if (this.total >= this.attemptLimit && activeSignals === 0) {
      return this.caughtRatio >= this.targetPercent ? 'won' : 'lost'
    }

    return 'running'
  }
}
