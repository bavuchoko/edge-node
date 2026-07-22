import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { getHandlePosition } from '../geometry'
import { useConnectionDrag } from '../hooks/useConnectionDrag'
import { useViewport } from '../hooks/useViewport'
import { getEdges, getNodes, graphReducer } from '../store'
import {
  resolveGraphTheme,
  themeToCssVars,
  type GraphTheme,
} from '../theme'
import type { GraphState, NodeId, Point } from '../types'
import { ConnectionLine } from './ConnectionLine'
import { GraphEdge } from './GraphEdge'
import { GraphNode } from './GraphNode'

type GraphCanvasProps = {
  initialState: GraphState
  theme?: GraphTheme
}

export function GraphCanvas({ initialState, theme }: GraphCanvasProps) {
  const [state, dispatch] = useReducer(graphReducer, initialState)
  const resolvedTheme = useMemo(() => resolveGraphTheme(theme), [theme])
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
      dispatch({ type: 'completeConnection', targetId })
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

  const onNodeDragStart = useCallback((id: NodeId, event: React.PointerEvent) => {
    if (event.button !== 0) return
    const node = nodesRef.current[id]
    if (!node) return

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
      window.removeEventListener('pointermove', onWindowMove)
      window.removeEventListener('pointerup', onWindowUp)
      window.removeEventListener('pointercancel', onWindowUp)
    }

    window.addEventListener('pointermove', onWindowMove)
    window.addEventListener('pointerup', onWindowUp)
    window.addEventListener('pointercancel', onWindowUp)
  }, [])

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
          dispatch({ type: 'deleteSelection' })
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [state.selection])

  const draftSourcePoint = useMemo(() => {
    if (!state.connectionDraft) return null
    const node = state.nodes[state.connectionDraft.sourceId]
    if (!node) return null
    return getHandlePosition(node, 'right')
  }, [state.connectionDraft, state.nodes])

  const { x, y, zoom } = state.viewport
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
                zoom={zoom}
                hitWidthPx={resolvedTheme.edge.hitWidth}
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
              onSelect={(id) =>
                dispatch({
                  type: 'setSelection',
                  selection: { type: 'node', id },
                })
              }
              onDragStart={onNodeDragStart}
              onSourceHandleDown={connection.startFromHandle}
              onSizeChange={onNodeSizeChange}
            />
          ))}
        </div>
      </div>

      <div className="graph-hud" aria-hidden>
        <span>
          Scroll to zoom · Drag empty space to pan · Drag right handle to
          connect · Del to remove
        </span>
      </div>
    </div>
  )
}
