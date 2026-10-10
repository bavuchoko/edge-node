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

function getBezierControls(source: Point, target: Point): [Point, Point] {
  const dx = Math.abs(target.x - source.x)
  const curvature = Math.max(dx * 0.5, 40)
  return [
    { x: source.x + curvature, y: source.y },
    { x: target.x - curvature, y: target.y },
  ]
}

/** Cubic bezier path from source (right) to target (left). */
export function getBezierPath(source: Point, target: Point): string {
  const [c1, c2] = getBezierControls(source, target)
  return `M ${source.x} ${source.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${target.x} ${target.y}`
}

/** Point halfway along the curve drawn by `getBezierPath`. */
export function getBezierMidpoint(source: Point, target: Point): Point {
  const [c1, c2] = getBezierControls(source, target)
  return {
    x: (source.x + 3 * c1.x + 3 * c2.x + target.x) / 8,
    y: (source.y + 3 * c1.y + 3 * c2.y + target.y) / 8,
  }
}

/** Gap between an arrow tip and the target handle center, in world units. */
export const ARROW_TIP_GAP = 7

/**
 * Edge geometry ending in an arrowhead at `target`. The curve stops at the
 * arrow's notch so the stroke doesn't poke through the tip. Bezier tangents
 * at the target are always horizontal, so the arrow points in +x.
 */
export function getArrowEdge(
  source: Point,
  target: Point,
  arrowLength: number,
): { path: string; arrow: string | null } {
  if (arrowLength <= 0) {
    return { path: getBezierPath(source, target), arrow: null }
  }
  const tip = { x: target.x - ARROW_TIP_GAP, y: target.y }
  const half = arrowLength * 0.55
  const notchX = tip.x - arrowLength * 0.75
  const back = tip.x - arrowLength
  return {
    path: getBezierPath(source, { x: notchX, y: tip.y }),
    arrow: `M ${tip.x} ${tip.y} L ${back} ${tip.y - half} L ${notchX} ${tip.y} L ${back} ${tip.y + half} Z`,
  }
}

export function distance(a: Point, b: Point): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.hypot(dx, dy)
}
