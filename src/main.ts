import { Application } from 'pixi.js'
import './style.css'
import { Game } from './game/Game'
import { GAME_CONFIG } from './game/config'

const bootstrap = async (): Promise<void> => {
  const host = document.querySelector<HTMLDivElement>('#app')
  if (!host) {
    throw new Error('Missing #app root element')
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
  host.appendChild(app.canvas)

  const game = new Game(app)
  game.start()
}

void bootstrap()
