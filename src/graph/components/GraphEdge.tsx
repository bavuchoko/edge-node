import { getArrowEdge, getBezierMidpoint } from '../geometry'
import type { EdgeKind, Point } from '../types'

type GraphEdgeProps = {
  id: string
  source: Point
  target: Point
  kind?: EdgeKind
  label?: string
  selected: boolean
  /** Set when the edge lies on the hovered node's dependency chain. */
  role?: 'upstream' | 'downstream'
  dimmed?: boolean
  /** Waiting on `onConnect` to confirm. */
  pending?: boolean
  zoom: number
  hitWidthPx?: number
  arrowSizePx?: number
  onSelect: (id: string) => void
}

export function GraphEdge({
  id,
  source,
  target,
  kind = 'required',
  label,
  selected,
  role,
  dimmed = false,
  pending = false,
  zoom,
  hitWidthPx = 32,
  arrowSizePx = 9,
  onSelect,
}: GraphEdgeProps) {
  const scale = 1 / Math.max(zoom, 0.01)
  const { path, arrow } = getArrowEdge(source, target, arrowSizePx * scale)
  const hitWidth = hitWidthPx * scale
  const mid = label ? getBezierMidpoint(source, target) : null

  const className = [
    'graph-edge',
    `graph-edge--${kind}`,
    selected && 'is-selected',
    role && `is-${role}`,
    dimmed && 'is-dimmed',
    pending && 'is-pending',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <g
      className={className}
      data-edge-id={id}
      onPointerDown={(event) => {
        event.stopPropagation()
        onSelect(id)
      }}
    >
      <path d={path} className="graph-edge__hit" strokeWidth={hitWidth} />
      <path d={path} className="graph-edge__path" />
      {arrow ? <path d={arrow} className="graph-edge__arrow" /> : null}
      {mid ? (
        <text x={mid.x} y={mid.y} dy={-8} className="graph-edge__label">
          {label}
        </text>
      ) : null}
    </g>
  )
}
