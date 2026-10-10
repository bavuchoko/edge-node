import { wouldCreateCycle } from './dependencies'
import type {
  EdgeId,
  EdgePatch,
  GraphEdge,
  GraphEdgeInput,
  GraphNode,
  GraphState,
  NodeData,
  NodeId,
  Point,
  Selection,
  Viewport,
} from './types'

function createEdgeId(source: NodeId, target: NodeId): EdgeId {
  return `${source}->${target}`
}

export function createInitialState<TData = NodeData>(
  nodes: GraphNode<TData>[],
  edges: GraphEdgeInput[],
  viewport: Viewport = { x: 40, y: 40, zoom: 1 },
): GraphState<TData> {
  const nodeMap: Record<NodeId, GraphNode<TData>> = {}
  for (const node of nodes) {
    nodeMap[node.id] = node
  }

  const edgeMap: Record<EdgeId, GraphEdge> = {}
  for (const edge of edges) {
    const id = createEdgeId(edge.source, edge.target)
    edgeMap[id] = { ...edge, id }
  }

  return {
    nodes: nodeMap,
    edges: edgeMap,
    viewport,
    selection: null,
    connectionDraft: null,
  }
}

export type GraphAction =
  | { type: 'setViewport'; viewport: Viewport }
  | { type: 'moveNode'; id: NodeId; position: Point }
  | { type: 'resizeNode'; id: NodeId; width: number; height: number }
  | { type: 'setSelection'; selection: Selection }
  | { type: 'startConnection'; sourceId: NodeId; pointer: Point }
  | { type: 'updateConnection'; pointer: Point }
  | { type: 'cancelConnection' }
  | { type: 'completeConnection'; targetId: NodeId; allowCycles?: boolean }
  | { type: 'updateEdge'; id: EdgeId; patch: EdgePatch }
  | { type: 'addEdge'; edge: GraphEdge }
  | { type: 'removeEdge'; id: EdgeId }
  | { type: 'deleteSelection' }

export function graphReducer<TData>(
  state: GraphState<TData>,
  action: GraphAction,
): GraphState<TData> {
  switch (action.type) {
    case 'setViewport':
      return { ...state, viewport: action.viewport }

    case 'moveNode': {
      const node = state.nodes[action.id]
      if (!node) return state
      return {
        ...state,
        nodes: {
          ...state.nodes,
          [action.id]: { ...node, position: action.position },
        },
      }
    }

    case 'resizeNode': {
      const node = state.nodes[action.id]
      if (!node) return state
      if (node.width === action.width && node.height === action.height) {
        return state
      }
      return {
        ...state,
        nodes: {
          ...state.nodes,
          [action.id]: {
            ...node,
            width: action.width,
            height: action.height,
          },
        },
      }
    }

    case 'setSelection':
      return { ...state, selection: action.selection }

    case 'startConnection':
      return {
        ...state,
        connectionDraft: {
          sourceId: action.sourceId,
          pointer: action.pointer,
        },
        selection: null,
      }

    case 'updateConnection': {
      if (!state.connectionDraft) return state
      return {
        ...state,
        connectionDraft: {
          ...state.connectionDraft,
          pointer: action.pointer,
        },
      }
    }

    case 'cancelConnection':
      return { ...state, connectionDraft: null }

    case 'completeConnection': {
      const draft = state.connectionDraft
      if (!draft) return state
      const { sourceId } = draft
      const targetId = action.targetId
      if (sourceId === targetId) {
        return { ...state, connectionDraft: null }
      }
      if (!state.nodes[sourceId] || !state.nodes[targetId]) {
        return { ...state, connectionDraft: null }
      }
      const id = createEdgeId(sourceId, targetId)
      if (state.edges[id]) {
        return { ...state, connectionDraft: null }
      }
      if (!action.allowCycles && wouldCreateCycle(Object.values(state.edges), sourceId, targetId)) {
        return { ...state, connectionDraft: null }
      }
      return {
        ...state,
        connectionDraft: null,
        edges: {
          ...state.edges,
          [id]: { id, source: sourceId, target: targetId },
        },
        selection: { type: 'edge', id, created: true },
      }
    }

    case 'updateEdge': {
      const edge = state.edges[action.id]
      if (!edge) return state
      const next: GraphEdge = { ...edge, ...action.patch }
      if (!next.label) delete next.label
      if (!next.relation) delete next.relation
      if (!next.inverseRelation) delete next.inverseRelation
      return { ...state, edges: { ...state.edges, [action.id]: next } }
    }

    case 'addEdge': {
      const { edge } = action
      if (state.edges[edge.id]) return state
      if (!state.nodes[edge.source] || !state.nodes[edge.target]) return state
      return { ...state, edges: { ...state.edges, [edge.id]: edge } }
    }

    case 'removeEdge': {
      if (!state.edges[action.id]) return state
      const { [action.id]: _, ...rest } = state.edges
      const selection =
        state.selection?.type === 'edge' && state.selection.id === action.id
          ? null
          : state.selection
      return { ...state, edges: rest, selection }
    }

    case 'deleteSelection': {
      const sel = state.selection
      if (!sel) return state

      if (sel.type === 'edge') {
        const { [sel.id]: _, ...rest } = state.edges
        return { ...state, edges: rest, selection: null }
      }

      const nodeId = sel.id
      const { [nodeId]: __, ...restNodes } = state.nodes
      const restEdges: Record<EdgeId, GraphEdge> = {}
      for (const edge of Object.values(state.edges)) {
        if (edge.source !== nodeId && edge.target !== nodeId) {
          restEdges[edge.id] = edge
        }
      }
      return {
        ...state,
        nodes: restNodes,
        edges: restEdges,
        selection: null,
        connectionDraft: null,
      }
    }

    default:
      return state
  }
}

export function getNodes<TData>(state: GraphState<TData>): GraphNode<TData>[] {
  return Object.values(state.nodes)
}

export function getEdges<TData>(state: GraphState<TData>): GraphEdge[] {
  return Object.values(state.edges)
}
