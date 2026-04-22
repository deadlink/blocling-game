import type { Difficulty, SignalType } from '../config'
import { GAME_CONFIG } from '../config'
import type { NetworkGraph } from '../network/NetworkGraph'

export type SpawnEvent = {
  type: SignalType
  apartmentId: string
  routerId: string
}

export class BypassSpawner {
  private static readonly THREAT_SPAWN_SLOWDOWN = 1.15
  private static readonly VPN_SPAWN_CHANCE = 0.56
  private readonly difficulty: Difficulty
  private readonly graph: NetworkGraph
  private lockedTimerMs = 0
  private nextLockedSpawnMs = 0
  private boostedTimerMs = 0
  private nextBoostedSpawnMs = 0

  constructor(difficulty: Difficulty, graph: NetworkGraph) {
    this.difficulty = difficulty
    this.graph = graph
    this.nextLockedSpawnMs = this.randomInterval()
    this.nextBoostedSpawnMs = this.randomBoostedInterval()
  }

  update(deltaMs: number, boostedApartments: Set<string>): SpawnEvent[] {
    this.lockedTimerMs += deltaMs
    this.boostedTimerMs += deltaMs
    const spawned: SpawnEvent[] = []

    const allApartments = this.graph.getApartmentIds()
    const lockedApartments = allApartments.filter((apartmentId) => !boostedApartments.has(apartmentId))
    const boostedApartmentList = allApartments.filter((apartmentId) => boostedApartments.has(apartmentId))

    while (lockedApartments.length > 0 && this.lockedTimerMs >= this.nextLockedSpawnMs) {
      this.lockedTimerMs -= this.nextLockedSpawnMs
      if (Math.random() <= BypassSpawner.VPN_SPAWN_CHANCE) {
        spawned.push(this.createThreatEvent(lockedApartments))
      } else {
        spawned.push(this.createSocialEvent(lockedApartments))
      }
      this.nextLockedSpawnMs = this.randomInterval()
    }

    while (boostedApartmentList.length > 0 && this.boostedTimerMs >= this.nextBoostedSpawnMs) {
      this.boostedTimerMs -= this.nextBoostedSpawnMs
      spawned.push(this.createSocialEvent(boostedApartmentList))
      this.nextBoostedSpawnMs = this.randomBoostedInterval()
    }
    return spawned
  }

  private createThreatEvent(apartments: string[]): SpawnEvent {
    const apartmentId = apartments[Math.floor(Math.random() * apartments.length)]
    const routerId = this.graph.getConnectedRouterId(apartmentId)
    const type: SignalType = 'vpn'
    return { type, apartmentId, routerId }
  }

  private createSocialEvent(apartments: string[]): SpawnEvent {
    const apartmentId = apartments[Math.floor(Math.random() * apartments.length)]
    const routerId = this.graph.getConnectedRouterId(apartmentId)
    const roll = Math.random()
    const type: SignalType =
      roll < 0.35 ? 'youtube' : roll < 0.65 ? 'telegram' : roll < 0.88 ? 'x' : 'pornhub'
    return { type, apartmentId, routerId }
  }

  private randomInterval(): number {
    const [min, max] = GAME_CONFIG.difficulty[this.difficulty].spawnIntervalMs
    const interval = min + Math.random() * (max - min)
    return interval * BypassSpawner.THREAT_SPAWN_SLOWDOWN
  }

  private randomBoostedInterval(): number {
    const [min, max] = GAME_CONFIG.difficulty[this.difficulty].spawnIntervalMs
    const boostedMin = min * 0.5
    const boostedMax = max * 0.62
    return boostedMin + Math.random() * (boostedMax - boostedMin)
  }
}
