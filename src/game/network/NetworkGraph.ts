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
  private static readonly MIN_CONNECTION_LENGTH = 230
  private readonly nodes = new Map<string, NetworkNode>()
  private readonly adjacency = new Map<string, Set<string>>()
  private readonly apartments: string[] = []
  private readonly routers = new Set<string>()
  private readonly routerList: string[] = []
  private readonly intersections: string[] = []
  private readonly apartmentGateway = new Map<string, string>()
  private readonly apartmentEntryPoint = new Map<string, Vec2>()
  private readonly apartmentConnectedRouter = new Map<string, string>()

  constructor() {
    this.buildNodes()
    this.buildEdges()
    this.assignApartmentConnections()
  }

  getApartmentIds(): string[] {
    return [...this.apartments]
  }

  getRouterIds(): string[] {
    return [...this.routerList]
  }

  getNodePosition(id: string): Vec2 {
    const node = this.nodes.get(id)
    if (!node) {
      throw new Error(`Network node "${id}" not found`)
    }
    return node.position
  }

  getRouterPositions(): Vec2[] {
    return this.routerList.map((id) => this.getNodePosition(id))
  }

  getRouterNodes(): Array<{ id: string; position: Vec2 }> {
    return this.routerList.map((id) => ({
      id,
      position: this.getNodePosition(id)
    }))
  }

  getConnectedRouterId(apartmentId: string): string {
    const routerId = this.apartmentConnectedRouter.get(apartmentId)
    if (!routerId) {
      throw new Error(`Connected router for "${apartmentId}" not found`)
    }
    return routerId
  }

  getApartmentConnectionPath(apartmentId: string): Vec2[] {
    const routerId = this.getConnectedRouterId(apartmentId)
    return this.getPath(apartmentId, routerId)
  }

  getApartmentConnectionPaths(): Array<{ apartmentId: string; routerId: string; path: Vec2[] }> {
    return this.apartments.map((apartmentId) => {
      const routerId = this.getConnectedRouterId(apartmentId)
      return {
        apartmentId,
        routerId,
        path: this.getPath(apartmentId, routerId)
      }
    })
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
        if (this.isApartmentId(fromId) !== this.isApartmentId(toId)) {
          const apartmentId = this.isApartmentId(fromId) ? fromId : toId
          const gatewayId = this.isApartmentId(fromId) ? toId : fromId
          const points = this.getApartmentToGatewayPath(apartmentId, gatewayId)
          for (let i = 0; i < points.length - 1; i += 1) {
            segments.push({
              from: points[i],
              to: points[i + 1]
            })
          }
        } else {
          const from = this.getCablePoint(fromId)
          const to = this.getCablePoint(toId)
          segments.push({
            from,
            to
          })
        }
      }
    }
    return segments
  }

  getRandomApartmentId(): string {
    return this.apartments[Math.floor(Math.random() * this.apartments.length)]
  }

  getRandomRouterId(): string {
    return this.routerList[Math.floor(Math.random() * this.routerList.length)]
  }

  getNearestRouterId(apartmentId: string): string {
    const source = this.getNodePosition(apartmentId)
    let best = this.routerList[0]
    let bestDistance = Number.POSITIVE_INFINITY
    for (const routerId of this.routerList) {
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
    if (this.isApartmentId(fromId)) {
      const gateway = this.apartmentGateway.get(fromId)
      if (!gateway) {
        return []
      }

      const corePath = this.getPathBetweenNodes(gateway, toId)
      if (corePath.length === 0) {
        return []
      }
      const apartmentPath = this.getApartmentToGatewayPath(fromId, gateway)
      return [...apartmentPath, ...corePath.slice(1)]
    }

    const direct = this.getPathBetweenNodes(fromId, toId)
    return direct
  }

  private getPathBetweenNodes(fromId: string, toId: string): Vec2[] {
    if (fromId === toId) {
      return [this.getCablePoint(fromId)]
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
    return ids.map((id) => this.getCablePoint(id))
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
        const id = this.intersectionId(col, row)
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
        this.intersections.push(id)
      }
    }

    this.selectRouters()
  }

  private buildEdges(): void {
    this.buildIntersectionTree()
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

      const validCandidates: string[] = []
      for (const [col, row] of routerCandidates) {
        if (this.isRouterInBounds(col, row)) {
          validCandidates.push(this.intersectionId(col, row))
        }
      }

      if (validCandidates.length === 0) {
        continue
      }

      const selected = validCandidates[Math.floor(Math.random() * validCandidates.length)]
      this.apartmentGateway.set(apartmentId, selected)
      this.apartmentEntryPoint.set(apartmentId, this.computeApartmentEntryPoint(apartmentId, selected))
      this.connect(apartmentId, selected)
    }
  }

  private isRouterInBounds(col: number, row: number): boolean {
    return col >= 0 && row >= 0 && col < GAME_CONFIG.grid.cols - 1 && row < GAME_CONFIG.grid.rows - 1
  }

  private apartmentId(col: number, row: number): string {
    return `a-${col}-${row}`
  }

  private intersectionId(col: number, row: number): string {
    return `r-${col}-${row}`
  }

  private selectRouters(): void {
    const rows = GAME_CONFIG.grid.rows - 1
    const cols = GAME_CONFIG.grid.cols - 1
    const targetRouters = 5

    const candidates: Array<[number, number]> = [
      [0, 0],
      [cols - 1, 0],
      [Math.floor((cols - 1) / 2), Math.floor((rows - 1) / 2)],
      [0, rows - 1],
      [cols - 1, rows - 1]
    ]

    for (const [col, row] of candidates) {
      this.addRouter(col, row)
    }

    while (this.routerList.length < targetRouters) {
      const col = Math.floor(Math.random() * cols)
      const row = Math.floor(Math.random() * rows)
      this.addRouter(col, row)
    }
  }

  private buildIntersectionTree(): void {
    if (this.intersections.length === 0) {
      return
    }

    const start = this.intersections[Math.floor(Math.random() * this.intersections.length)]
    const visited = new Set<string>([start])
    const frontier: Array<{ from: string; to: string }> = this.getNeighborIntersections(start).map((to) => ({
      from: start,
      to
    }))

    while (frontier.length > 0) {
      const index = Math.floor(Math.random() * frontier.length)
      const edge = frontier.splice(index, 1)[0]
      if (visited.has(edge.to)) {
        continue
      }
      visited.add(edge.to)
      this.connect(edge.from, edge.to)

      for (const next of this.getNeighborIntersections(edge.to)) {
        if (!visited.has(next)) {
          frontier.push({ from: edge.to, to: next })
        }
      }
    }
  }

  private getNeighborIntersections(id: string): string[] {
    const node = this.nodes.get(id)
    if (!node) {
      return []
    }
    const neighbors: string[] = []
    const variants: Array<[number, number]> = [
      [node.col - 1, node.row],
      [node.col + 1, node.row],
      [node.col, node.row - 1],
      [node.col, node.row + 1]
    ]
    for (const [col, row] of variants) {
      if (!this.isRouterInBounds(col, row)) {
        continue
      }
      neighbors.push(this.intersectionId(col, row))
    }
    return neighbors
  }

  private computeApartmentEntryPoint(apartmentId: string, gatewayId: string): Vec2 {
    const apartment = this.getNodePosition(apartmentId)
    const gateway = this.getNodePosition(gatewayId)
    const dirX = gateway.x - apartment.x
    const dirY = gateway.y - apartment.y
    const absX = Math.abs(dirX)
    const absY = Math.abs(dirY)

    const halfWidth = 86
    const halfHeight = 62
    if (absX > absY) {
      return {
        x: apartment.x + Math.sign(dirX) * halfWidth,
        y: apartment.y
      }
    }
    return {
      x: apartment.x,
      y: apartment.y + Math.sign(dirY) * halfHeight
    }
  }

  private getCablePoint(id: string): Vec2 {
    if (this.isApartmentId(id)) {
      return this.apartmentEntryPoint.get(id) ?? this.getNodePosition(id)
    }
    return this.getNodePosition(id)
  }

  private getApartmentToGatewayPath(apartmentId: string, gatewayId: string): Vec2[] {
    const entry = this.apartmentEntryPoint.get(apartmentId) ?? this.getNodePosition(apartmentId)
    const gateway = this.getNodePosition(gatewayId)
    const mid: Vec2 = { x: gateway.x, y: entry.y }
    const points: Vec2[] = [entry]

    if (Math.abs(mid.x - entry.x) > 0.1 || Math.abs(mid.y - entry.y) > 0.1) {
      points.push(mid)
    }
    if (Math.abs(gateway.x - mid.x) > 0.1 || Math.abs(gateway.y - mid.y) > 0.1) {
      points.push(gateway)
    } else if (points[points.length - 1] !== gateway) {
      points.push(gateway)
    }

    return points
  }

  private isApartmentId(id: string): boolean {
    return id.startsWith('a-')
  }

  private addRouter(col: number, row: number): void {
    if (!this.isRouterInBounds(col, row)) {
      return
    }
    const id = this.intersectionId(col, row)
    if (this.routers.has(id)) {
      return
    }
    this.routers.add(id)
    this.routerList.push(id)
  }

  private assignApartmentConnections(): void {
    for (const apartmentId of this.apartments) {
      const gateway = this.apartmentGateway.get(apartmentId)
      if (!gateway) {
        continue
      }

      let bestRouter = this.routerList[0]
      let bestDistance = Number.POSITIVE_INFINITY
      let longestRouter = this.routerList[0]
      let longestDistance = -1

      for (const routerId of this.routerList) {
        const corePath = this.getPathBetweenNodes(gateway, routerId)
        const fullPath = [this.getCablePoint(apartmentId), ...corePath]
        const distance = this.measurePathLength(fullPath)

        if (distance >= NetworkGraph.MIN_CONNECTION_LENGTH && distance < bestDistance) {
          bestDistance = distance
          bestRouter = routerId
        }

        if (distance > longestDistance) {
          longestDistance = distance
          longestRouter = routerId
        }
      }

      if (bestDistance === Number.POSITIVE_INFINITY) {
        bestRouter = longestRouter
      }

      this.apartmentConnectedRouter.set(apartmentId, bestRouter)
    }
  }

  private measurePathLength(path: Vec2[]): number {
    let distance = 0
    for (let i = 0; i < path.length - 1; i += 1) {
      const dx = path[i + 1].x - path[i].x
      const dy = path[i + 1].y - path[i].y
      distance += Math.sqrt(dx * dx + dy * dy)
    }
    return distance
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
