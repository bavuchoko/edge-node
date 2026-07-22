import type { GraphNode, Point } from './types'

export const DEFAULT_NODE_WIDTH = 300
export const DEFAULT_NODE_HEIGHT = 150

/** Screen (client) → world coordinates given viewport transform. */
export function screenToWorld(
  screen: Point,
  viewportOrigin: Point,
  viewport: { x: number; y: number; zoom: number },
): Point {
  return {
    x: (screen.x - viewportOrigin.x - viewport.x) / viewport.zoom,
    y: (screen.y - viewportOrigin.y - viewport.y) / viewport.zoom,
  }
}

export function getHandlePosition(
  node: GraphNode,
  side: 'left' | 'right',
): Point {
  const y = node.position.y + node.height / 2
  if (side === 'left') {
    return { x: node.position.x, y }
  }
  return { x: node.position.x + node.width, y }
}

/** Cubic bezier path from source (right) to target (left). */
export function getBezierPath(source: Point, target: Point): string {
  const dx = Math.abs(target.x - source.x)
  const curvature = Math.max(dx * 0.5, 40)
  const c1x = source.x + curvature
  const c1y = source.y
  const c2x = target.x - curvature
  const c2y = target.y
  return `M ${source.x} ${source.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${target.x} ${target.y}`
}

export function distance(a: Point, b: Point): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.hypot(dx, dy)
}
