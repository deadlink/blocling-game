export type Difficulty = 'easy' | 'normal' | 'hard'
export type SignalType = 'vpn' | 'proxy'

type DifficultyConfig = {
  targetPercent: number
  spawnIntervalMs: [number, number]
  attemptLimit: number
  signalSpeed: Record<SignalType, number>
}

export const GAME_CONFIG = {
  viewport: {
    width: 1240,
    height: 860
  },
  grid: {
    cols: 7,
    rows: 5,
    cellWidth: 150,
    cellHeight: 145,
    originX: 170,
    originY: 125
  },
  colors: {
    background: 0x070b13,
    apartment: 0x182033,
    apartmentBorder: 0x2b3a57,
    desk: 0x5c4a2f,
    computer: 0x46d2ff,
    resident: 0xf2d399,
    cable: 0x4f5f7f,
    router: 0xbb68ff,
    routerCore: 0xf8e38f,
    vpn: 0x3bff9f,
    proxy: 0xffa551,
    hud: 0xd9e3ff,
    win: 0x74ff81,
    lose: 0xff6174
  },
  difficulty: {
    easy: {
      targetPercent: 0.7,
      spawnIntervalMs: [1350, 2100],
      attemptLimit: 35,
      signalSpeed: { vpn: 140, proxy: 115 }
    },
    normal: {
      targetPercent: 0.8,
      spawnIntervalMs: [1000, 1650],
      attemptLimit: 42,
      signalSpeed: { vpn: 165, proxy: 135 }
    },
    hard: {
      targetPercent: 0.9,
      spawnIntervalMs: [700, 1250],
      attemptLimit: 50,
      signalSpeed: { vpn: 190, proxy: 155 }
    }
  } satisfies Record<Difficulty, DifficultyConfig>
}

export const DEFAULT_DIFFICULTY: Difficulty = 'normal'
