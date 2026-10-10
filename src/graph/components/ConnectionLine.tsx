import { getArrowEdge } from '../geometry'
import type { Point } from '../types'

type ConnectionLineProps = {
  source: Point
  target: Point
  /** Arrowhead length in world units. */
  arrowLength: number
}

export function ConnectionLine({ source, target, arrowLength }: ConnectionLineProps) {
  const { path, arrow } = getArrowEdge(source, target, arrowLength)
  return (
    <g className="graph-connection-line">
      <path d={path} className="graph-connection-line__path" />
      {arrow ? <path d={arrow} className="graph-connection-line__arrow" /> : null}
    </g>
  )
}
