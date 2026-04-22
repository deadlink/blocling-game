import { Assets, Rectangle, Texture } from 'pixi.js'

export type RetroSpriteSheets = {
  roomVariants: Texture[][]
  routerNormalFrames: Texture[]
  routerAlertFrames: Texture[]
}

const ROOM_WIDTH = 96
const ROOM_HEIGHT = 96
const ROUTER_SIZE = 28

export const createRetroSpriteSheetsFromAtlas = (): RetroSpriteSheets => {
  const roomSheet = Assets.get('/assets/sprites/room_sheet.png') as Texture | undefined
  const routerSheet = Assets.get('/assets/sprites/router_sheet.png') as Texture | undefined

  if (!roomSheet?.source || !routerSheet?.source) {
    throw new Error('Sprite atlases are not loaded. Load them via Assets.load before creating GridView.')
  }

  const roomVariants: Texture[][] = [0, 1, 2].map((row) =>
    [0, 1, 2].map((col) => sliceTexture(roomSheet, col * ROOM_WIDTH, row * ROOM_HEIGHT, ROOM_WIDTH, ROOM_HEIGHT))
  )

  const routerNormalFrames = [0, 1, 2, 3].map((col) =>
    sliceTexture(routerSheet, col * ROUTER_SIZE, 0, ROUTER_SIZE, ROUTER_SIZE)
  )

  const routerAlertFrames = [0, 1, 2, 3].map((col) =>
    sliceTexture(routerSheet, col * ROUTER_SIZE, ROUTER_SIZE, ROUTER_SIZE, ROUTER_SIZE)
  )

  return {
    roomVariants,
    routerNormalFrames,
    routerAlertFrames
  }
}

const sliceTexture = (sheet: Texture, x: number, y: number, width: number, height: number): Texture => {
  return new Texture({
    source: sheet.source,
    frame: new Rectangle(x, y, width, height)
  })
}
