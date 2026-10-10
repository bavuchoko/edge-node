import type { EdgeId, GraphEdge, NodeId } from './types'

/**
 * Edge direction is `source → target`: the target depends on the source.
 * - upstream of X: nodes X (transitively) depends on
 * - downstream of X: nodes that (transitively) depend on X
 */
export type DependencyRole = 'focus' | 'upstream' | 'downstream'

export type DependencyHighlight = {
  focusId: NodeId
  nodes: Map<NodeId, DependencyRole>
  edges: Map<EdgeId, 'upstream' | 'downstream'>
  /**
   * Relation of each direct neighbor to the focus node, read as
   * "neighbor <relation> focus": an outgoing edge's `relation` for its target,
   * an incoming edge's `inverseRelation` for its source. Only set when present.
   */
  relations: Map<NodeId, string>
}

function collect(
  edges: Iterable<GraphEdge>,
  startId: NodeId,
  direction: 'upstream' | 'downstream',
): Set<NodeId> {
  const next = new Map<NodeId, NodeId[]>()
  for (const edge of edges) {
    const from = direction === 'upstream' ? edge.target : edge.source
    const to = direction === 'upstream' ? edge.source : edge.target
    const list = next.get(from)
    if (list) list.push(to)
    else next.set(from, [to])
  }

  const visited = new Set<NodeId>()
  const stack = [startId]
  while (stack.length > 0) {
    const id = stack.pop()!
    for (const neighbor of next.get(id) ?? []) {
      if (neighbor === startId || visited.has(neighbor)) continue
      visited.add(neighbor)
      stack.push(neighbor)
    }
  }
  return visited
}

/** Nodes that `nodeId` transitively depends on. */
export function getUpstream(edges: Iterable<GraphEdge>, nodeId: NodeId): Set<NodeId> {
  return collect(edges, nodeId, 'upstream')
}

/** Nodes that transitively depend on `nodeId`. */
export function getDownstream(edges: Iterable<GraphEdge>, nodeId: NodeId): Set<NodeId> {
  return collect(edges, nodeId, 'downstream')
}

/** True when adding `source → target` would close a dependency cycle. */
export function wouldCreateCycle(
  edges: Iterable<GraphEdge>,
  source: NodeId,
  target: NodeId,
): boolean {
  if (source === target) return true
  return getDownstream(edges, target).has(source)
}

/** Roles of every node/edge on a dependency chain through `focusId`. */
export function getDependencyHighlight(
  edges: GraphEdge[],
  focusId: NodeId,
): DependencyHighlight {
  const upstream = getUpstream(edges, focusId)
  const downstream = getDownstream(edges, focusId)

  const nodes = new Map<NodeId, DependencyRole>()
  for (const id of upstream) nodes.set(id, 'upstream')
  for (const id of downstream) nodes.set(id, 'downstream')
  nodes.set(focusId, 'focus')

  const edgeRoles = new Map<EdgeId, 'upstream' | 'downstream'>()
  const relations = new Map<NodeId, string>()
  for (const edge of edges) {
    if (edge.source === focusId && edge.relation) {
      relations.set(edge.target, edge.relation)
    } else if (edge.target === focusId && edge.inverseRelation) {
      relations.set(edge.source, edge.inverseRelation)
    }
    if (upstream.has(edge.source) && (edge.target === focusId || upstream.has(edge.target))) {
      edgeRoles.set(edge.id, 'upstream')
    } else if (
      downstream.has(edge.target) &&
      (edge.source === focusId || downstream.has(edge.source))
    ) {
      edgeRoles.set(edge.id, 'downstream')
    }
  }

  return { focusId, nodes, edges: edgeRoles, relations }
}
