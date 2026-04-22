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
      <div class="canvas-shell"></div>
      <aside class="hud-side hud-side-right"></aside>
    </div>
  `

  const canvasShell = host.querySelector<HTMLDivElement>('.canvas-shell')
  const leftHud = host.querySelector<HTMLElement>('.hud-side-left')
  const rightHud = host.querySelector<HTMLElement>('.hud-side-right')
  if (!canvasShell || !leftHud || !rightHud) {
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
}

void bootstrap()
