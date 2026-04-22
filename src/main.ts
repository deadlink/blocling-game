import { Application, Assets } from 'pixi.js'
import './style.css'
import { ROOM_SHEET_URL, ROUTER_SHEET_URL } from './game/assetPaths'
import { Game } from './game/Game'
import { GAME_CONFIG } from './game/config'
import { DomHud } from './ui/DomHud'

const bootstrap = async (): Promise<void> => {
  const host = document.querySelector<HTMLDivElement>('#app')
  if (!host) {
    throw new Error('Missing #app root element')
  }

  host.innerHTML = `
    <div class="game-shell">
      <aside class="hud-side hud-side-left"></aside>
      <div class="canvas-shell">
        <div class="game-start-overlay">
          <div class="game-start-title">NET DEFENSE</div>
          <div class="game-start-action" role="button" tabindex="0">START</div>
          <div class="game-start-hint">OR PRESS SPACE</div>
        </div>
        <div class="game-pause-overlay">PAUSE</div>
      </div>
      <aside class="hud-side hud-side-right"></aside>
    </div>
  `

  const canvasShell = host.querySelector<HTMLDivElement>('.canvas-shell')
  const leftHud = host.querySelector<HTMLElement>('.hud-side-left')
  const rightHud = host.querySelector<HTMLElement>('.hud-side-right')
  const startOverlay = host.querySelector<HTMLElement>('.game-start-overlay')
  const startAction = host.querySelector<HTMLElement>('.game-start-action')
  const pauseOverlay = host.querySelector<HTMLElement>('.game-pause-overlay')
  if (!canvasShell || !leftHud || !rightHud || !startOverlay || !startAction || !pauseOverlay) {
    throw new Error('Failed to initialize game layout')
  }

  const app = new Application()
  await app.init({
    width: GAME_CONFIG.viewport.width,
    height: GAME_CONFIG.viewport.height,
    background: GAME_CONFIG.colors.background,
    antialias: false,
    preference: 'webgl',
    resolution: window.devicePixelRatio || 1,
    autoDensity: true
  })

  app.canvas.style.imageRendering = 'pixelated'
  canvasShell.appendChild(app.canvas)

  await Assets.load([ROOM_SHEET_URL, ROUTER_SHEET_URL])

  const hud = new DomHud(leftHud, rightHud)
  const game = new Game(app, hud)
  game.start()

  const startGame = (): void => {
    if (game.isStarted()) {
      return
    }
    game.startFromInput()
    startOverlay.classList.add('is-hidden')
    pauseOverlay.classList.remove('is-visible')
  }

  const togglePause = (): void => {
    if (!game.isStarted()) {
      startGame()
      return
    }
    const paused = game.togglePause()
    pauseOverlay.classList.toggle('is-visible', paused)
  }

  startAction.addEventListener('click', startGame)
  startAction.addEventListener('keydown', (event) => {
    if (event.code === 'Enter' || event.code === 'Space') {
      event.preventDefault()
      startGame()
    }
  })

  window.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
      event.preventDefault()
      togglePause()
      return
    }
    if (event.code === 'KeyR' || event.code === 'Digit1' || event.code === 'Digit2' || event.code === 'Digit3') {
      pauseOverlay.classList.remove('is-visible')
    }
  })
}

void bootstrap()
