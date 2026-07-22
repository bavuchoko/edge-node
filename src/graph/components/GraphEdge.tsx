import { getBezierPath } from '../geometry'
import type { Point } from '../types'

/** Target hit width in screen pixels (stays constant across zoom). */
const HIT_SCREEN_PX = 32

type GraphEdgeProps = {
  id: string
  source: Point
  target: Point
  selected: boolean
  zoom: number
  onSelect: (id: string) => void
}

export function GraphEdge({
  id,
  source,
  target,
  selected,
  zoom,
  onSelect,
}: GraphEdgeProps) {
  const d = getBezierPath(source, target)
  const hitWidth = HIT_SCREEN_PX / Math.max(zoom, 0.01)

  return (
    <g
      className={`graph-edge${selected ? ' is-selected' : ''}`}
      onPointerDown={(event) => {
        event.stopPropagation()
        onSelect(id)
      }}
    >
      <path d={d} className="graph-edge__hit" strokeWidth={hitWidth} />
      <path d={d} className="graph-edge__path" />
    </g>
  )
}
