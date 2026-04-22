export type Difficulty = 'easy' | 'normal' | 'hard'
export type SignalType = 'vpn' | 'youtube' | 'telegram' | 'x' | 'pornhub'

type DifficultyConfig = {
  targetPercent: number
  spawnIntervalMs: [number, number]
  attemptLimit: number
  signalSpeed: Record<SignalType, number>
}

export const GAME_CONFIG = {
  viewport: {
    width: 1900,
    height: 1360
  },
  grid: {
    cols: 5,
    rows: 5,
    cellWidth: 300,
    cellHeight: 240,
    originX: 350,
    originY: 200
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
    youtube: 0xff3b3b,
    telegram: 0x44bafc,
    x: 0xd9d9d9,
    pornhub: 0xff9800,
    hud: 0xd9e3ff,
    win: 0x74ff81,
    lose: 0xff6174
  },
  difficulty: {
    easy: {
      targetPercent: 0.7,
      spawnIntervalMs: [1350, 2100],
      attemptLimit: 35,
      signalSpeed: { vpn: 44, youtube: 44, telegram: 44, x: 44, pornhub: 44 }
    },
    normal: {
      targetPercent: 0.8,
      spawnIntervalMs: [1000, 1650],
      attemptLimit: 42,
      signalSpeed: { vpn: 51, youtube: 51, telegram: 51, x: 51, pornhub: 51 }
    },
    hard: {
      targetPercent: 0.9,
      spawnIntervalMs: [700, 1250],
      attemptLimit: 50,
      signalSpeed: { vpn: 59, youtube: 59, telegram: 59, x: 59, pornhub: 59 }
    }
  } satisfies Record<Difficulty, DifficultyConfig>
}

export const DEFAULT_DIFFICULTY: Difficulty = 'normal'
