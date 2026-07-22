export type NodeId = string
export type EdgeId = string

export type Point = { x: number; y: number }

export type NodeStatus = 'success' | 'error' | 'idle'

export type NodeData = {
  title: string
  subtitle?: string
  status: NodeStatus
  stats?: string
  badge?: string
}

export type GraphNode = {
  id: NodeId
  position: Point
  width: number
  height: number
  data: NodeData
}

export type GraphEdge = {
  id: EdgeId
  source: NodeId
  target: NodeId
}

export type Viewport = {
  x: number
  y: number
  zoom: number
}

export type HandleSide = 'left' | 'right'

export type Selection =
  | { type: 'node'; id: NodeId }
  | { type: 'edge'; id: EdgeId }
  | null

export type ConnectionDraft = {
  sourceId: NodeId
  pointer: Point
}

export type GraphState = {
  nodes: Record<NodeId, GraphNode>
  edges: Record<EdgeId, GraphEdge>
  viewport: Viewport
  selection: Selection
  connectionDraft: ConnectionDraft | null
}
