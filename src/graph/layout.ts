import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from './geometry'
import type { GraphNode, NodeData, NodeId, Point } from './types'

export type LayoutNodeInput<TData = NodeData> = {
  id: NodeId
  data: TData
  /** Column index (0 = leftmost). */
  column: number
  /** Order within column (top to bottom). */
  row: number
  /** Fixed position (e.g. restored from storage). Overrides `column` / `row` placement. */
  position?: Point
  width?: number
  height?: number
}

const COLUMN_GAP = 120
const ROW_GAP = 48
const ORIGIN_X = 0
const ORIGIN_Y = 0

/**
 * Simple left-to-right column layout. Data matching `NodeData` is checked
 * against it (so `status: 'success'` stays a literal); any other shape is
 * inferred — pass `layoutColumns<MyData>(...)` to pin it down.
 */
export function layoutColumns(inputs: LayoutNodeInput<NodeData>[]): GraphNode<NodeData>[]
export function layoutColumns<TData>(inputs: LayoutNodeInput<TData>[]): GraphNode<TData>[]
export function layoutColumns<TData>(inputs: LayoutNodeInput<TData>[]): GraphNode<TData>[] {
  const widths = new Map<number, number>()
  for (const input of inputs) {
    const w = input.width ?? DEFAULT_NODE_WIDTH
    widths.set(input.column, Math.max(widths.get(input.column) ?? 0, w))
  }

  const columnX = new Map<number, number>()
  let x = ORIGIN_X
  const sortedColumns = [...new Set(inputs.map((i) => i.column))].sort(
    (a, b) => a - b,
  )
  for (const col of sortedColumns) {
    columnX.set(col, x)
    x += (widths.get(col) ?? DEFAULT_NODE_WIDTH) + COLUMN_GAP
  }

  return inputs.map((input) => {
    const width = input.width ?? DEFAULT_NODE_WIDTH
    const height = input.height ?? DEFAULT_NODE_HEIGHT
    const position: Point = input.position ?? {
      x: columnX.get(input.column) ?? 0,
      y: ORIGIN_Y + input.row * (height + ROW_GAP),
    }
    return {
      id: input.id,
      position,
      width,
      height,
      data: input.data,
    }
  })
}
