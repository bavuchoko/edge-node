import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { getDependencyHighlight, getUpstream, type DependencyRole } from '../dependencies'
import { getBezierMidpoint, getHandlePosition } from '../geometry'
import { useSystemColorMode, type ColorModePreference } from '../hooks/useColorMode'
import { useConnectionDrag } from '../hooks/useConnectionDrag'
import { useGraphPersistence, type GraphPersistenceCallbacks } from '../hooks/useGraphPersistence'
import { useViewport } from '../hooks/useViewport'
import { getEdges, getNodes, graphReducer } from '../store'
import {
  resolveGraphTheme,
  themeToCssVars,
  type GraphTheme,
} from '../theme'
import type { GraphState, NodeId, Point } from '../types'
import { ConnectionLine } from './ConnectionLine'
import { EdgeEditor } from './EdgeEditor'
import { GraphEdge } from './GraphEdge'
import { GraphNode } from './GraphNode'

/**
 * Change callbacks (`onConnect`, `onEdgeUpdate`, `onEdgeDelete`, `onNodeMove`)
 * apply the change locally first; return `false` or reject to roll it back.
 * While an edge callback's promise is pending the edge is drawn faded.
 */
export type GraphCanvasProps = GraphPersistenceCallbacks & {
  initialState: GraphState
  /** Overrides applied on top of the `colorMode` preset. */
  theme?: GraphTheme
  /** Base color preset. `'system'` follows `prefers-color-scheme`. Defaults to `'dark'`. */
  colorMode?: ColorModePreference
  /**
   * Allow connections that close a dependency cycle (A → B → A).
   * Defaults to `false`: such connections are rejected.
   */
  allowCycles?: boolean
}

export function GraphCanvas({
  initialState,
  theme,
  colorMode = 'dark',
  allowCycles = false,
  onConnect,
  onEdgeUpdate,
  onEdgeDelete,
  onNodeMove,
}: GraphCanvasProps) {
  const [state, dispatch] = useReducer(graphReducer, initialState)
  const { savingEdgeIds, deleteSelection, reportNodeMove } = useGraphPersistence({
    state,
    dispatch,
    onConnect,
    onEdgeUpdate,
    onEdgeDelete,
    onNodeMove,
  })
  const systemColorMode = useSystemColorMode()
  const resolvedColorMode = colorMode === 'system' ? systemColorMode : colorMode
  const resolvedTheme = useMemo(
    () => resolveGraphTheme(theme, resolvedColorMode),
    [theme, resolvedColorMode],
  )
  const themeStyle = useMemo(() => themeToCssVars(resolvedTheme), [resolvedTheme])
  const nodes = useMemo(() => getNodes(state), [state])
  const edges = useMemo(() => getEdges(state), [state])
  const nodesRef = useRef(state.nodes)
  nodesRef.current = state.nodes

  const onViewportChange = useCallback((viewport: GraphState['viewport']) => {
    dispatch({ type: 'setViewport', viewport })
  }, [])

  const {
    containerRef,
    isPanning,
    clientToWorld,
    startPan,
    movePan,
    endPan,
  } = useViewport({
    viewport: state.viewport,
    onViewportChange,
  })

  const clientToWorldRef = useRef(clientToWorld)
  clientToWorldRef.current = clientToWorld

  const connection = useConnectionDrag({
    clientToWorld,
    onStart: (sourceId, pointer) => {
      dispatch({ type: 'startConnection', sourceId, pointer })
    },
    onMove: (pointer) => {
      dispatch({ type: 'updateConnection', pointer })
    },
    onComplete: (targetId) => {
      dispatch({ type: 'completeConnection', targetId, allowCycles })
    },
    onCancel: () => {
      dispatch({ type: 'cancelConnection' })
    },
  })

  const nodeDrag = useRef<{
    id: NodeId
    pointerId: number
    offset: Point
  } | null>(null)

  const [hoveredNodeId, setHoveredNodeId] = useState<NodeId | null>(null)

  const onNodeDragStart = useCallback((id: NodeId, event: React.PointerEvent) => {
    if (event.button !== 0) return
    const node = nodesRef.current[id]
    if (!node) return
    const startPosition = node.position

    const world = clientToWorldRef.current(event.clientX, event.clientY)
    nodeDrag.current = {
      id,
      pointerId: event.pointerId,
      offset: {
        x: world.x - node.position.x,
        y: world.y - node.position.y,
      },
    }

    const onWindowMove = (e: PointerEvent) => {
      const drag = nodeDrag.current
      if (!drag || drag.pointerId !== e.pointerId) return
      const next = clientToWorldRef.current(e.clientX, e.clientY)
      dispatch({
        type: 'moveNode',
        id: drag.id,
        position: {
          x: next.x - drag.offset.x,
          y: next.y - drag.offset.y,
        },
      })
    }

    const onWindowUp = (e: PointerEvent) => {
      const drag = nodeDrag.current
      if (!drag || drag.pointerId !== e.pointerId) return
      nodeDrag.current = null
      reportNodeMove(drag.id, startPosition)
      // Hover events were ignored during the drag; resync with where the pointer ended up.
      const under = document.elementFromPoint(e.clientX, e.clientY)
      const hoverEl = under?.closest<HTMLElement>('.graph-node')
      setHoveredNodeId(hoverEl?.dataset.nodeId ?? null)
      window.removeEventListener('pointermove', onWindowMove)
      window.removeEventListener('pointerup', onWindowUp)
      window.removeEventListener('pointercancel', onWindowUp)
    }

    window.addEventListener('pointermove', onWindowMove)
    window.addEventListener('pointerup', onWindowUp)
    window.addEventListener('pointercancel', onWindowUp)
  }, [reportNodeMove])

  const onNodeSizeChange = useCallback(
    (id: string, size: { width: number; height: number }) => {
      dispatch({
        type: 'resizeNode',
        id,
        width: size.width,
        height: size.height,
      })
    },
    [],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }

      if (event.key === 'Escape') {
        dispatch({ type: 'cancelConnection' })
        dispatch({ type: 'setSelection', selection: null })
        return
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (state.selection) {
          event.preventDefault()
          deleteSelection()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [state.selection, deleteSelection])

  const draftSourcePoint = useMemo(() => {
    if (!state.connectionDraft) return null
    const node = state.nodes[state.connectionDraft.sourceId]
    if (!node) return null
    return getHandlePosition(node, 'right')
  }, [state.connectionDraft, state.nodes])

  const onNodeHoverChange = useCallback((id: NodeId, hovered: boolean) => {
    // Keep the dragged node focused even if the pointer briefly outruns it.
    if (nodeDrag.current) return
    setHoveredNodeId((current) => (hovered ? id : current === id ? null : current))
  }, [])

  /** Dependency chain through the hovered node. Suppressed while panning or connecting. */
  const highlight = useMemo(() => {
    if (!hoveredNodeId || !state.nodes[hoveredNodeId]) return null
    if (isPanning || state.connectionDraft) return null
    return getDependencyHighlight(edges, hoveredNodeId)
  }, [edges, hoveredNodeId, state.nodes, isPanning, state.connectionDraft])

  /** While connecting: nodes the draft cannot end on (self, duplicate, or a cycle). */
  const invalidTargets = useMemo(() => {
    const draft = state.connectionDraft
    if (!draft) return null
    const invalid = new Set<NodeId>([draft.sourceId])
    for (const edge of edges) {
      if (edge.source === draft.sourceId) invalid.add(edge.target)
    }
    if (!allowCycles) {
      for (const id of getUpstream(edges, draft.sourceId)) invalid.add(id)
    }
    return invalid
  }, [state.connectionDraft, edges, allowCycles])

  const { x, y, zoom } = state.viewport

  const editingEdge =
    state.selection?.type === 'edge' && !state.connectionDraft
      ? state.edges[state.selection.id]
      : undefined

  /** Below the edge midpoint, in canvas-relative screen px. */
  const editorPosition = useMemo((): Point | null => {
    if (!editingEdge) return null
    const sourceNode = state.nodes[editingEdge.source]
    const targetNode = state.nodes[editingEdge.target]
    if (!sourceNode || !targetNode) return null
    const mid = getBezierMidpoint(
      getHandlePosition(sourceNode, 'right'),
      getHandlePosition(targetNode, 'left'),
    )
    return { x: x + mid.x * zoom, y: y + mid.y * zoom + 14 }
  }, [editingEdge, state.nodes, x, y, zoom])
  const transform = `translate(${x}px, ${y}px) scale(${zoom})`

  const onCanvasPointerDown = (event: React.PointerEvent) => {
    if (event.button !== 0) return
    const t = event.target as HTMLElement
    if (
      t.closest('.graph-node') ||
      t.closest('.graph-edge') ||
      t.closest('[data-handle]')
    ) {
      return
    }
    dispatch({ type: 'setSelection', selection: null })
    startPan(event)
  }

  return (
    <div
      ref={containerRef}
      className={`graph-canvas${isPanning ? ' is-panning' : ''}${state.connectionDraft ? ' is-connecting' : ''}`}
      style={themeStyle}
      data-color-mode={resolvedColorMode}
      onPointerDown={onCanvasPointerDown}
      onPointerMove={movePan}
      onPointerUp={endPan}
      onPointerCancel={endPan}
    >
      <div className="graph-world" style={{ transform }}>
        <svg className="graph-edges" aria-hidden>
          {edges.map((edge) => {
            const sourceNode = state.nodes[edge.source]
            const targetNode = state.nodes[edge.target]
            if (!sourceNode || !targetNode) return null
            const source = getHandlePosition(sourceNode, 'right')
            const target = getHandlePosition(targetNode, 'left')
            return (
              <GraphEdge
                key={edge.id}
                id={edge.id}
                source={source}
                target={target}
                kind={edge.kind}
                label={edge.label}
                role={highlight?.edges.get(edge.id)}
                dimmed={highlight ? !highlight.edges.has(edge.id) : false}
                pending={savingEdgeIds.has(edge.id)}
                zoom={zoom}
                hitWidthPx={resolvedTheme.edge.hitWidth}
                arrowSizePx={resolvedTheme.edge.arrowSize}
                selected={
                  state.selection?.type === 'edge' &&
                  state.selection.id === edge.id
                }
                onSelect={(id) =>
                  dispatch({
                    type: 'setSelection',
                    selection: { type: 'edge', id },
                  })
                }
              />
            )
          })}
          {draftSourcePoint && state.connectionDraft ? (
            <ConnectionLine
              source={draftSourcePoint}
              target={state.connectionDraft.pointer}
              arrowLength={resolvedTheme.edge.arrowSize / Math.max(zoom, 0.01)}
            />
          ) : null}
        </svg>

        <div className="graph-nodes">
          {nodes.map((node) => (
            <GraphNode
              key={node.id}
              node={node}
              selected={
                state.selection?.type === 'node' &&
                state.selection.id === node.id
              }
              role={highlight?.nodes.get(node.id)}
              dimmed={
                invalidTargets
                  ? invalidTargets.has(node.id)
                  : highlight
                    ? !highlight.nodes.has(node.id)
                    : false
              }
              onSelect={(id) =>
                dispatch({
                  type: 'setSelection',
                  selection: { type: 'node', id },
                })
              }
              onHoverChange={onNodeHoverChange}
              onDragStart={onNodeDragStart}
              onSourceHandleDown={connection.startFromHandle}
              onSizeChange={onNodeSizeChange}
            />
          ))}
        </div>
      </div>

      {editingEdge && editorPosition ? (
        <EdgeEditor
          key={editingEdge.id}
          edge={editingEdge}
          position={editorPosition}
          autoFocus={state.selection?.type === 'edge' && state.selection.created}
          onChange={(patch) => dispatch({ type: 'updateEdge', id: editingEdge.id, patch })}
          onDelete={deleteSelection}
          onClose={() => dispatch({ type: 'setSelection', selection: null })}
        />
      ) : null}

      <div className="graph-hud" aria-hidden>
        {highlight ? (
          <span className="graph-hud__legend">
            <span className="graph-hud__swatch graph-hud__swatch--upstream" />
            Depends on ({countRole(highlight.nodes, 'upstream')})
            <span className="graph-hud__swatch graph-hud__swatch--downstream" />
            Depended on by ({countRole(highlight.nodes, 'downstream')})
          </span>
        ) : null}
        <span>
          Scroll to zoom · Drag empty space to pan · Drag right handle to
          connect · Click a line to edit · Del to remove
        </span>
      </div>
    </div>
  )
}

function countRole(nodes: Map<NodeId, DependencyRole>, role: DependencyRole): number {
  let count = 0
  for (const value of nodes.values()) if (value === role) count++
  return count
}
