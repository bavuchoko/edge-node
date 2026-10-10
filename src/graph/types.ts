export type NodeId = string
export type EdgeId = string

export type Point = { x: number; y: number }

export type NodeStatus = 'success' | 'error' | 'idle'

export type NodeDetail = {
  label: string
  value: string | number
}

export type NodeData = {
  title: string
  subtitle?: string
  status: NodeStatus
  stats?: string
  badge?: string
  /** Rows shown when the node is expanded (click its content area). */
  details?: NodeDetail[]
}

/**
 * `TData` is free-form when you draw cards yourself with `renderNode`; the
 * built-in card reads the `NodeData` fields.
 */
export type GraphNode<TData = NodeData> = {
  id: NodeId
  position: Point
  width: number
  height: number
  data: TData
}

/**
 * - `required`: target cannot run without source (solid line)
 * - `optional`: soft / ordering-only dependency (dashed line)
 */
export type EdgeKind = 'required' | 'optional'

/** Directed edge: `target` depends on `source`. */
export type GraphEdge = {
  id: EdgeId
  source: NodeId
  target: NodeId
  /** Defaults to `'required'`. */
  kind?: EdgeKind
  /** Short text drawn at the middle of the edge. */
  label?: string
}

export type GraphEdgeInput = Omit<GraphEdge, 'id'>

export type Viewport = {
  x: number
  y: number
  zoom: number
}

export type HandleSide = 'left' | 'right'

export type Selection =
  | { type: 'node'; id: NodeId }
  /** `created` is set right after the edge was drawn, so its editor can grab focus. */
  | { type: 'edge'; id: EdgeId; created?: boolean }
  | null

export type ConnectionDraft = {
  sourceId: NodeId
  pointer: Point
}

export type GraphState<TData = NodeData> = {
  nodes: Record<NodeId, GraphNode<TData>>
  edges: Record<EdgeId, GraphEdge>
  viewport: Viewport
  selection: Selection
  connectionDraft: ConnectionDraft | null
}
