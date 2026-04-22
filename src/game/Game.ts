import { Application, Container } from 'pixi.js'
import { AudioSystem } from '../audio/AudioSystem'
import { HudView } from '../ui/HudView'
import { DEFAULT_DIFFICULTY, GAME_CONFIG, type Difficulty, type SignalType } from './config'
import { SignalIcon } from './entities/SignalIcon'
import { BypassSpawner } from './events/BypassSpawner'
import { GridView } from './grid/GridView'
import { ClickCatcher } from './input/ClickCatcher'
import { NetworkGraph } from './network/NetworkGraph'
import { MatchState, type MatchStatus } from './state/MatchState'

type ActiveSignal = {
  entity: SignalIcon
}

export class Game {
  private readonly app: Application
  private readonly root = new Container()
  private readonly playfield = new Container()
  private readonly signalLayer = new Container()
  private readonly network = new NetworkGraph()
  private readonly clickCatcher = new ClickCatcher()
  private readonly hud = new HudView()
  private readonly audio = new AudioSystem()

  private difficulty: Difficulty = DEFAULT_DIFFICULTY
  private status: MatchStatus = 'running'
  private matchState = new MatchState(0, 1)
  private spawner = new BypassSpawner(this.difficulty, this.network)
  private readonly activeSignals = new Set<ActiveSignal>()

  constructor(app: Application) {
    this.app = app
    const grid = new GridView(this.network)
    this.playfield.addChild(grid.container, this.signalLayer)
    this.root.addChild(this.playfield, this.hud.container)
    this.app.stage.addChild(this.root)
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
    const settings = GAME_CONFIG.difficulty[this.difficulty]
    this.status = 'running'
    this.matchState = new MatchState(settings.targetPercent, settings.attemptLimit)
    this.spawner = new BypassSpawner(this.difficulty, this.network)
    this.clearSignals()
    this.audio.startBgm()
    this.hud.update(this.matchState, this.status, this.activeSignals.size, this.difficulty)
  }

  private update(deltaMs: number): void {
    if (this.status === 'running') {
      this.spawnSignals(deltaMs)
      this.tickSignals(deltaMs / 1000)
      this.status = this.matchState.resolveStatus(this.activeSignals.size)
      if (this.status !== 'running') {
        this.audio.stopBgm()
      }
    }

    this.hud.update(this.matchState, this.status, this.activeSignals.size, this.difficulty)
  }

  private spawnSignals(deltaMs: number): void {
    if (this.matchState.total >= this.matchState.attemptLimit) {
      return
    }

    const events = this.spawner.update(deltaMs)
    for (const event of events) {
      if (this.matchState.total >= this.matchState.attemptLimit) {
        break
      }
      this.createSignal(event.type, event.apartmentId, event.routerId)
    }
  }

  private createSignal(type: SignalType, apartmentId: string, routerId: string): void {
    const settings = GAME_CONFIG.difficulty[this.difficulty]
    const path = this.network.getPath(apartmentId, routerId)
    if (path.length < 2) {
      return
    }

    const entity = new SignalIcon(type, path, settings.signalSpeed[type])
    const active: ActiveSignal = { entity }
    this.signalLayer.addChild(entity)
    this.activeSignals.add(active)
    this.matchState.registerSpawn()
    this.audio.playSpawnSfx(type)

    this.clickCatcher.bind(entity, () => {
      if (!this.activeSignals.has(active)) {
        return
      }
      this.matchState.registerCaught()
      this.removeSignal(active)
    })
  }

  private tickSignals(deltaSec: number): void {
    for (const signal of this.activeSignals) {
      const reached = signal.entity.update(deltaSec)
      if (!reached) {
        continue
      }
      this.matchState.registerMissed()
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
}
