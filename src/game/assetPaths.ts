const base = import.meta.env.BASE_URL

const joinBase = (path: string): string => {
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  return `${normalizedBase}${path}`
}

export const ROOM_SHEET_URL = joinBase('assets/sprites/room_sheet.png')
export const ROUTER_SHEET_URL = joinBase('assets/sprites/router_sheet.png')
export const BGM_LOOP_URL = joinBase('assets/audio/bgm_loop.mp3')
