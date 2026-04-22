import type { Difficulty, SignalType } from '../config'
import { GAME_CONFIG } from '../config'
import type { NetworkGraph } from '../network/NetworkGraph'

export type SpawnEvent = {
  type: SignalType
  apartmentId: string
  routerId: string
}

export class BypassSpawner {
  private readonly difficulty: Difficulty
  private readonly graph: NetworkGraph
  private timerMs = 0
  private nextSpawnMs = 0

  constructor(difficulty: Difficulty, graph: NetworkGraph) {
    this.difficulty = difficulty
    this.graph = graph
    this.nextSpawnMs = this.randomInterval()
  }

  update(deltaMs: number): SpawnEvent[] {
    this.timerMs += deltaMs
    const spawned: SpawnEvent[] = []

    while (this.timerMs >= this.nextSpawnMs) {
      this.timerMs -= this.nextSpawnMs
      spawned.push(this.createThreatEvent())
      this.nextSpawnMs = this.randomInterval()
    }
    return spawned
  }

  private createThreatEvent(): SpawnEvent {
    const apartmentId = this.graph.getRandomApartmentId()
    const routerId = this.graph.getConnectedRouterId(apartmentId)
    const type: SignalType = Math.random() > 0.45 ? 'vpn' : 'proxy'
    return { type, apartmentId, routerId }
  }

  private randomInterval(): number {
    const [min, max] = GAME_CONFIG.difficulty[this.difficulty].spawnIntervalMs
    return min + Math.random() * (max - min)
  }
}
