import { GAME_CONFIG } from '../config'

export type NodeKind = 'apartment' | 'router'

export type Vec2 = {
  x: number
  y: number
}

type NetworkNode = {
  id: string
  kind: NodeKind
  col: number
  row: number
  position: Vec2
}

export class NetworkGraph {
  private readonly nodes = new Map<string, NetworkNode>()
  private readonly adjacency = new Map<string, Set<string>>()
  private readonly apartments: string[] = []
  private readonly routers: string[] = []

  constructor() {
    this.buildNodes()
    this.buildEdges()
  }

  getApartmentIds(): string[] {
    return [...this.apartments]
  }

  getRouterIds(): string[] {
    return [...this.routers]
  }

  getNodePosition(id: string): Vec2 {
    const node = this.nodes.get(id)
    if (!node) {
      throw new Error(`Network node "${id}" not found`)
    }
    return node.position
  }

  getRouterPositions(): Vec2[] {
    return this.routers.map((id) => this.getNodePosition(id))
  }

  getCableSegments(): Array<{ from: Vec2; to: Vec2 }> {
    const segments: Array<{ from: Vec2; to: Vec2 }> = []
    const seen = new Set<string>()
    for (const [fromId, neighbors] of this.adjacency) {
      for (const toId of neighbors) {
        const key = fromId < toId ? `${fromId}->${toId}` : `${toId}->${fromId}`
        if (seen.has(key)) {
          continue
        }
        seen.add(key)
        segments.push({
          from: this.getNodePosition(fromId),
          to: this.getNodePosition(toId)
        })
      }
    }
    return segments
  }

  getRandomApartmentId(): string {
    return this.apartments[Math.floor(Math.random() * this.apartments.length)]
  }

  getRandomRouterId(): string {
    return this.routers[Math.floor(Math.random() * this.routers.length)]
  }

  getNearestRouterId(apartmentId: string): string {
    const source = this.getNodePosition(apartmentId)
    let best = this.routers[0]
    let bestDistance = Number.POSITIVE_INFINITY
    for (const routerId of this.routers) {
      const router = this.getNodePosition(routerId)
      const distance = Math.abs(source.x - router.x) + Math.abs(source.y - router.y)
      if (distance < bestDistance) {
        bestDistance = distance
        best = routerId
      }
    }
    return best
  }

  getPath(fromId: string, toId: string): Vec2[] {
    if (fromId === toId) {
      return [this.getNodePosition(fromId)]
    }

    const queue = [fromId]
    const visited = new Set<string>([fromId])
    const parent = new Map<string, string>()

    while (queue.length > 0) {
      const current = queue.shift()
      if (!current) {
        break
      }
      if (current === toId) {
        break
      }
      const neighbors = this.adjacency.get(current)
      if (!neighbors) {
        continue
      }
      for (const neighbor of neighbors) {
        if (visited.has(neighbor)) {
          continue
        }
        visited.add(neighbor)
        parent.set(neighbor, current)
        queue.push(neighbor)
      }
    }

    if (!visited.has(toId)) {
      return []
    }

    const ids: string[] = []
    let cursor = toId
    ids.push(cursor)
    while (cursor !== fromId) {
      const next = parent.get(cursor)
      if (!next) {
        return []
      }
      cursor = next
      ids.push(cursor)
    }

    ids.reverse()
    return ids.map((id) => this.getNodePosition(id))
  }

  private buildNodes(): void {
    const { cols, rows, cellWidth, cellHeight, originX, originY } = GAME_CONFIG.grid

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const id = this.apartmentId(col, row)
        this.nodes.set(id, {
          id,
          kind: 'apartment',
          col,
          row,
          position: {
            x: originX + col * cellWidth,
            y: originY + row * cellHeight
          }
        })
        this.apartments.push(id)
      }
    }

    for (let row = 0; row < rows - 1; row += 1) {
      for (let col = 0; col < cols - 1; col += 1) {
        const id = this.routerId(col, row)
        this.nodes.set(id, {
          id,
          kind: 'router',
          col,
          row,
          position: {
            x: originX + (col + 0.5) * cellWidth,
            y: originY + (row + 0.5) * cellHeight
          }
        })
        this.routers.push(id)
      }
    }
  }

  private buildEdges(): void {
    for (const apartmentId of this.apartments) {
      const apartment = this.nodes.get(apartmentId)
      if (!apartment) {
        continue
      }

      const routerCandidates = [
        [apartment.col - 1, apartment.row - 1],
        [apartment.col, apartment.row - 1],
        [apartment.col - 1, apartment.row],
        [apartment.col, apartment.row]
      ]

      for (const [routerCol, routerRow] of routerCandidates) {
        if (!this.isRouterInBounds(routerCol, routerRow)) {
          continue
        }
        this.connect(apartmentId, this.routerId(routerCol, routerRow))
      }
    }

    const maxRouterCol = GAME_CONFIG.grid.cols - 1
    const maxRouterRow = GAME_CONFIG.grid.rows - 1
    for (let row = 0; row < maxRouterRow; row += 1) {
      for (let col = 0; col < maxRouterCol; col += 1) {
        const id = this.routerId(col, row)
        if (col + 1 < maxRouterCol) {
          this.connect(id, this.routerId(col + 1, row))
        }
        if (row + 1 < maxRouterRow) {
          this.connect(id, this.routerId(col, row + 1))
        }
      }
    }
  }

  private isRouterInBounds(col: number, row: number): boolean {
    return col >= 0 && row >= 0 && col < GAME_CONFIG.grid.cols - 1 && row < GAME_CONFIG.grid.rows - 1
  }

  private apartmentId(col: number, row: number): string {
    return `a-${col}-${row}`
  }

  private routerId(col: number, row: number): string {
    return `r-${col}-${row}`
  }

  private connect(a: string, b: string): void {
    if (!this.adjacency.has(a)) {
      this.adjacency.set(a, new Set())
    }
    if (!this.adjacency.has(b)) {
      this.adjacency.set(b, new Set())
    }
    this.adjacency.get(a)?.add(b)
    this.adjacency.get(b)?.add(a)
  }
}
