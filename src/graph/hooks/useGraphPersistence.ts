import { useCallback, useEffect, useRef, useState, type Dispatch } from 'react'
import type { GraphAction } from '../store'
import type { EdgeId, GraphEdge, GraphNode, GraphState, NodeId, Point } from '../types'

/** Return `false` or reject to roll the change back. */
export type GraphCallbackResult = void | boolean | Promise<void | boolean>

export type GraphPersistenceCallbacks = {
  /**
   * A new connection was confirmed: called once when its editor closes
   * (Enter, Esc or clicking elsewhere) with the final `kind` and `label`.
   * Not called if the connection is deleted before that.
   */
  onConnect?: (edge: GraphEdge) => GraphCallbackResult
  /**
   * An existing connection's `kind` / `label` changed: called once when its
   * editor closes, only if something actually changed.
   */
  onEdgeUpdate?: (edge: GraphEdge, previous: GraphEdge) => GraphCallbackResult
  /**
   * A confirmed connection was removed — directly, or because one of its
   * nodes was deleted (called once per edge).
   */
  onEdgeDelete?: (edge: GraphEdge) => GraphCallbackResult
  /**
   * A node was dragged to a new place: called once on drop (not while
   * dragging), only if it actually moved. `node.position` is the new spot.
   */
  onNodeMove?: (node: GraphNode, previous: Point) => GraphCallbackResult
}

type UseGraphPersistenceArgs = GraphPersistenceCallbacks & {
  state: GraphState
  dispatch: Dispatch<GraphAction>
}

function hasEdgeChanged(before: GraphEdge, after: GraphEdge): boolean {
  return (
    (before.kind ?? 'required') !== (after.kind ?? 'required') ||
    (before.label ?? '') !== (after.label ?? '')
  )
}

/**
 * Reports graph changes to the host (e.g. to save them through an API) and
 * rolls the local change back when the host rejects it.
 */
export function useGraphPersistence({
  state,
  dispatch,
  onConnect,
  onEdgeUpdate,
  onEdgeDelete,
  onNodeMove,
}: UseGraphPersistenceArgs) {
  const callbacks = useRef({ onConnect, onEdgeUpdate, onEdgeDelete, onNodeMove })
  callbacks.current = { onConnect, onEdgeUpdate, onEdgeDelete, onNodeMove }
  const stateRef = useRef(state)
  stateRef.current = state

  const [savingEdgeIds, setSavingEdgeIds] = useState<ReadonlySet<EdgeId>>(new Set())

  const persist = useCallback(
    async (
      name: string,
      edgeId: EdgeId | null,
      call: () => GraphCallbackResult,
      rollback: () => void,
    ) => {
      const setSaving = (saving: boolean) =>
        edgeId &&
        setSavingEdgeIds((current) => {
          const next = new Set(current)
          if (saving) next.add(edgeId)
          else next.delete(edgeId)
          return next
        })

      setSaving(true)
      try {
        if ((await call()) === false) rollback()
      } catch (error) {
        console.error(`[edge-node] ${name} failed; change rolled back`, error)
        rollback()
      } finally {
        setSaving(false)
      }
    },
    [],
  )

  /** The edge whose editor is open, with its value when the editor opened. */
  const openEdge = useRef<{ id: EdgeId; created: boolean; snapshot: GraphEdge } | null>(null)

  // The editor follows selection: closing it (selection moving on) commits the edit.
  useEffect(() => {
    const sel = state.selection
    const open = openEdge.current

    if (open && !(sel?.type === 'edge' && sel.id === open.id)) {
      openEdge.current = null
      const edge = stateRef.current.edges[open.id]
      if (edge && open.created) {
        const handler = callbacks.current.onConnect
        if (handler) {
          void persist('onConnect', edge.id, () => handler(edge), () =>
            dispatch({ type: 'removeEdge', id: edge.id }),
          )
        }
      } else if (edge && hasEdgeChanged(open.snapshot, edge)) {
        const handler = callbacks.current.onEdgeUpdate
        const previous = open.snapshot
        if (handler) {
          void persist('onEdgeUpdate', edge.id, () => handler(edge, previous), () =>
            dispatch({
              type: 'updateEdge',
              id: edge.id,
              patch: { kind: previous.kind, label: previous.label },
            }),
          )
        }
      }
    }

    if (sel?.type === 'edge' && openEdge.current?.id !== sel.id) {
      const edge = stateRef.current.edges[sel.id]
      if (edge) openEdge.current = { id: sel.id, created: Boolean(sel.created), snapshot: edge }
    }
  }, [state.selection, dispatch, persist])

  /** Deletes the current selection and reports every confirmed edge it removes. */
  const deleteSelection = useCallback(() => {
    const { selection, edges } = stateRef.current
    if (!selection) return

    const removed =
      selection.type === 'edge'
        ? [edges[selection.id]].filter(Boolean)
        : Object.values(edges).filter(
            (edge) => edge.source === selection.id || edge.target === selection.id,
          )

    // A new edge whose editor is still open was never reported, so there is nothing to undo.
    const unconfirmedId = openEdge.current?.created ? openEdge.current.id : null
    if (selection.type === 'edge' && openEdge.current?.id === selection.id) {
      openEdge.current = null
    }

    dispatch({ type: 'deleteSelection' })

    const handler = callbacks.current.onEdgeDelete
    if (!handler) return
    for (const edge of removed) {
      if (edge.id === unconfirmedId) continue
      void persist('onEdgeDelete', edge.id, () => handler(edge), () =>
        dispatch({ type: 'addEdge', edge }),
      )
    }
  }, [dispatch, persist])

  /** Call on drop with where the node started; reports the move if it changed. */
  const reportNodeMove = useCallback(
    (id: NodeId, from: Point) => {
      const handler = callbacks.current.onNodeMove
      const node = stateRef.current.nodes[id]
      if (!handler || !node) return
      if (node.position.x === from.x && node.position.y === from.y) return
      void persist('onNodeMove', null, () => handler(node, from), () =>
        dispatch({ type: 'moveNode', id, position: from }),
      )
    },
    [dispatch, persist],
  )

  return { savingEdgeIds, deleteSelection, reportNodeMove }
}
