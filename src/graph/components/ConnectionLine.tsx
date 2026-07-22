import { getBezierPath } from '../geometry'
import type { Point } from '../types'

type ConnectionLineProps = {
  source: Point
  target: Point
}

export function ConnectionLine({ source, target }: ConnectionLineProps) {
  const d = getBezierPath(source, target)
  return (
    <g className="graph-connection-line">
      <path d={d} className="graph-connection-line__path" />
    </g>
  )
}
