import { Application, Container } from 'pixi.js'
import { AudioSystem } from '../audio/AudioSystem'
import { DEFAULT_DIFFICULTY, GAME_CONFIG, type Difficulty, type SignalType } from './config'
import { SignalIcon } from './entities/SignalIcon'
import { BypassSpawner } from './events/BypassSpawner'
import { GridView } from './grid/GridView'
import { ClickCatcher } from './input/ClickCatcher'
import { NetworkGraph } from './network/NetworkGraph'
import { MatchState, type MatchStatus } from './state/MatchState'

type HudAdapter = {
  update: (matchState: MatchState, activeSignals: number, difficulty: Difficulty) => void
}

type ActiveSignal = {
  entity: SignalIcon
  apartmentId: string
  signalType: SignalType
  routerId: string
}

export class Game {
  private static readonly BOOST_SPEED_MULTIPLIER = 1.5
  private static readonly ROUTER_CLICKS_TO_CLOSE = 5
  private static readonly LEVEL_SPEED_STEP = 0.12
  private static readonly LEVEL_SPAWN_STEP = 0.1
  private static readonly SOCIAL_MISS_PENALTY: Record<'youtube' | 'telegram' | 'x' | 'pornhub', number> = {
    youtube: 2,
    telegram: 4,
    x: 8,
    pornhub: 15
  }
  private static readonly SOCIAL_CATCH_REWARD: Record<'youtube' | 'telegram' | 'x' | 'pornhub', number> = {
    youtube: 2,
    telegram: 4,
    x: 8,
    pornhub: 15
  }
  private readonly app: Application
  private readonly root = new Container()
  private readonly playfield = new Container()
  private readonly signalLayer = new Container()
  private readonly network = new NetworkGraph()
  private readonly grid = new GridView(this.network)
  private readonly clickCatcher = new ClickCatcher()
  private readonly hud: HudAdapter
  private readonly audio = new AudioSystem()

  private difficulty: Difficulty = DEFAULT_DIFFICULTY
  private status: MatchStatus = 'running'
  private matchState = new MatchState()
  private spawner = new BypassSpawner(this.difficulty, this.network)
  private readonly activeSignals = new Set<ActiveSignal>()
  private readonly boostedRouterApartment = new Map<string, string>()
  private readonly routerCloseProgress = new Map<string, number>()

  constructor(app: Application, hud: HudAdapter) {
    this.app = app
    this.hud = hud
    this.playfield.addChild(this.grid.container, this.signalLayer, this.grid.routerOverlay)
    this.root.addChild(this.playfield)
    this.app.stage.addChild(this.root)
    this.grid.setRouterTapHandler((routerId) => this.onRouterTap(routerId))
    this.bindKeys()
    this.audio.bindUnlock(this.app.stage, () => {
      if (this.status === 'running') {
        this.audio.startBgm()
      }
    })
  }

  start(): void {
    this.startRound()
    this.app.ticker.add(() => this.update(this.app.ticker.deltaMS))
  }

  private startRound(): void {
    this.status = 'running'
    this.matchState = new MatchState()
    this.spawner = new BypassSpawner(this.difficulty, this.network)
    this.boostedRouterApartment.clear()
    this.routerCloseProgress.clear()
    this.syncBoostedRoutesView()
    this.clearSignals()
    this.audio.startBgm()
    this.hud.update(this.matchState, this.activeSignals.size, this.difficulty)
  }

  private update(deltaMs: number): void {
    this.grid.update(deltaMs / 1000)

    if (this.status === 'running') {
      this.spawnSignals(deltaMs)
      this.tickSignals(deltaMs / 1000)
      this.status = this.matchState.resolveStatus()
      if (this.status !== 'running') {
        this.audio.stopBgm()
      }
    }

    this.hud.update(this.matchState, this.activeSignals.size, this.difficulty)
  }

  private spawnSignals(deltaMs: number): void {
    const boostedApartments = new Set(this.boostedRouterApartment.values())
    const spawnSpeedMultiplier = 1 + (this.matchState.level - 1) * Game.LEVEL_SPAWN_STEP
    const events = this.spawner.update(deltaMs * spawnSpeedMultiplier, boostedApartments)
    for (const event of events) {
      this.createSignal(event.type, event.apartmentId, event.routerId)
    }
  }

  private createSignal(type: SignalType, apartmentId: string, routerId: string): void {
    const settings = GAME_CONFIG.difficulty[this.difficulty]
    const path = this.network.getApartmentConnectionPath(apartmentId)
    if (path.length < 2) {
      return
    }

    const boosted = this.isBoostedRoute(routerId, apartmentId)
    const levelMultiplier = 1 + (this.matchState.level - 1) * Game.LEVEL_SPEED_STEP
    const baseSpeed = settings.signalSpeed[type] * levelMultiplier
    const speed = boosted && this.isSocial(type) ? baseSpeed * Game.BOOST_SPEED_MULTIPLIER : baseSpeed
    const entity = new SignalIcon(type, path, speed)
    const active: ActiveSignal = { entity, apartmentId, signalType: type, routerId }
    this.signalLayer.addChild(entity)
    this.activeSignals.add(active)
    if (this.isThreat(type)) {
      this.matchState.registerSpawn()
    }
    this.audio.playSpawnSfx(type)

    this.clickCatcher.bind(entity, () => {
      if (!this.activeSignals.has(active)) {
        return
      }
      this.matchState.registerCaught()
      if (this.isThreat(type)) {
        this.matchState.addScore(10)
      } else {
        this.matchState.addScore(this.getSocialCatchReward(type))
      }
      this.matchState.maybeLevelUp()
      this.audio.playCaughtSfx()
      this.removeSignal(active)
    })
  }

  private tickSignals(deltaSec: number): void {
    for (const signal of this.activeSignals) {
      const reached = signal.entity.update(deltaSec)
      if (!reached) {
        continue
      }
      if (this.isThreat(signal.signalType)) {
        this.matchState.registerMissed()
        this.grid.markRouterAlert(signal.routerId)
        this.audio.playMissedSfx()
        this.openBoostedRoute(signal.routerId, signal.apartmentId)
      } else {
        this.matchState.registerMissed()
        this.matchState.addScore(-this.getSocialMissPenalty(signal.signalType))
      }
      this.matchState.maybeLevelUp()
      this.removeSignal(signal)
    }
  }

  private removeSignal(signal: ActiveSignal): void {
    this.clickCatcher.unbind(signal.entity)
    this.activeSignals.delete(signal)
    signal.entity.destroy()
  }

  private clearSignals(): void {
    for (const signal of this.activeSignals) {
      this.clickCatcher.unbind(signal.entity)
      signal.entity.destroy()
    }
    this.activeSignals.clear()
  }

  private bindKeys(): void {
    window.addEventListener('keydown', (event) => {
      if (event.code === 'KeyR') {
        this.startRound()
      }
      if (event.code === 'Digit1') {
        this.difficulty = 'easy'
        this.startRound()
      }
      if (event.code === 'Digit2') {
        this.difficulty = 'normal'
        this.startRound()
      }
      if (event.code === 'Digit3') {
        this.difficulty = 'hard'
        this.startRound()
      }
    })
  }

  private onRouterTap(routerId: string): void {
    if (!this.boostedRouterApartment.has(routerId)) {
      return
    }
    this.audio.playRouterHitSfx()
    const progress = (this.routerCloseProgress.get(routerId) ?? 0) + 1
    this.routerCloseProgress.set(routerId, progress)
    this.syncBoostedRoutesView()
    if (progress >= Game.ROUTER_CLICKS_TO_CLOSE) {
      this.boostedRouterApartment.delete(routerId)
      this.routerCloseProgress.delete(routerId)
      this.syncBoostedRoutesView()
    }
  }

  private openBoostedRoute(routerId: string, apartmentId: string): void {
    this.boostedRouterApartment.set(routerId, apartmentId)
    this.routerCloseProgress.set(routerId, 0)
    this.syncBoostedRoutesView()
  }

  private syncBoostedRoutesView(): void {
    const boostedRoutes = [...this.boostedRouterApartment.entries()].map(([routerId, apartmentId]) => ({
      apartmentId,
      routerId,
      closeProgress: this.routerCloseProgress.get(routerId) ?? 0
    }))
    this.grid.setBoostedRoutes(boostedRoutes)
  }

  private isThreat(type: SignalType): boolean {
    return type === 'vpn'
  }

  private isSocial(type: SignalType): boolean {
    return type === 'youtube' || type === 'telegram' || type === 'x' || type === 'pornhub'
  }

  private isBoostedRoute(routerId: string, apartmentId: string): boolean {
    return this.boostedRouterApartment.get(routerId) === apartmentId
  }

  private getSocialMissPenalty(type: SignalType): number {
    switch (type) {
      case 'youtube':
        return Game.SOCIAL_MISS_PENALTY.youtube
      case 'telegram':
        return Game.SOCIAL_MISS_PENALTY.telegram
      case 'x':
        return Game.SOCIAL_MISS_PENALTY.x
      case 'pornhub':
        return Game.SOCIAL_MISS_PENALTY.pornhub
      case 'vpn':
        return 0
    }
  }

  private getSocialCatchReward(type: SignalType): number {
    switch (type) {
      case 'youtube':
        return Game.SOCIAL_CATCH_REWARD.youtube
      case 'telegram':
        return Game.SOCIAL_CATCH_REWARD.telegram
      case 'x':
        return Game.SOCIAL_CATCH_REWARD.x
      case 'pornhub':
        return Game.SOCIAL_CATCH_REWARD.pornhub
      case 'vpn':
        return 0
    }
  }
}
