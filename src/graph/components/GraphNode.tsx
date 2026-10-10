import { useEffect, useRef, type ReactNode } from 'react'
import type { DependencyRole } from '../dependencies'
import type { GraphNode as GraphNodeModel, NodeData, NodeStatus } from '../types'

/** State handed to `renderNode` so a custom card can reflect it. */
export type NodeRenderContext = {
  /** Edit mode (`true`) or view mode (`false`). */
  editable: boolean
  /** Selected in edit mode. */
  selected: boolean
  /** Position on the hovered node's dependency chain, if one is being shown. */
  role?: DependencyRole
  /**
   * This node's relation to the previous node on the hovered node's chain
   * (for a direct neighbor, the hovered node itself). Comes from the edge's
   * `relation` (downstream side) / `inverseRelation` (upstream side).
   */
  relation?: string
  /** Outside the chain currently highlighted (or an invalid target while connecting). */
  dimmed: boolean
  /** Details panel open (view mode). */
  expanded: boolean
  toggleExpanded: () => void
}

/**
 * Draws the inside of a node card. Return `undefined` to use the built-in card
 * for that node. Interactive elements you render (button, a, input, …) don't
 * toggle the details panel when clicked.
 */
export type RenderNode<TData> = (node: GraphNodeModel<TData>, ctx: NodeRenderContext) => ReactNode

type GraphNodeProps<TData> = {
  node: GraphNodeModel<TData>
  selected: boolean
  /**
   * `true`: the node can be selected, dragged and connected.
   * `false`: view mode — clicking expands/collapses its details instead.
   */
  editable: boolean
  /** Position relative to the hovered node's dependency chain. */
  role?: DependencyRole
  /** Relation chip text on the hovered node's chain (see `NodeRenderContext.relation`). */
  relation?: string
  dimmed?: boolean
  onSelect: (id: string) => void
  onHoverChange: (id: string, hovered: boolean) => void
  onDragStart: (id: string, event: React.PointerEvent) => void
  onSourceHandleDown: (id: string, event: React.PointerEvent) => void
  onSizeChange: (id: string, size: { width: number; height: number }) => void
  expanded: boolean
  onToggleExpanded: (id: string) => void
  /** Custom card body; see `RenderNode`. */
  renderNode?: RenderNode<TData>
  /** Custom detail body; defaults to `data.details` as label/value rows. */
  renderDetails?: (node: GraphNodeModel<TData>) => ReactNode
}

/** Pointer travel (screen px) beyond which a press counts as a drag, not a click. */
const CLICK_SLOP = 4

/** Clicks on these never toggle the details panel. */
const NO_TOGGLE_SELECTOR =
  '[data-handle], .graph-node__details, button, a, input, select, textarea, label, [data-no-toggle]'

/** The built-in card reads `NodeData`; with custom data any field may be missing. */
function asNodeData(data: unknown): Partial<NodeData> {
  return data && typeof data === 'object' ? (data as Partial<NodeData>) : {}
}

function DefaultDetails({ data }: { data: Partial<NodeData> }) {
  return (
    <dl className="graph-node__detail-list">
      {(data.details ?? []).map((row) => (
        <div key={row.label} className="graph-node__detail-row">
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function DefaultCard({
  title,
  data,
  ctx,
  expandable,
  detailsId,
}: {
  title: string
  data: Partial<NodeData>
  ctx: NodeRenderContext
  expandable: boolean
  detailsId: string
}) {
  const { role, relation, expanded } = ctx
  return (
    <>
      <div className="graph-node__header">
        <div className="graph-node__header-row">
          <StatusIcon status={data.status ?? 'idle'} />
          <div className="graph-node__header-end">
            {relation && (role === 'upstream' || role === 'downstream') ? (
              <span className={`graph-node__role graph-node__role--${role}`} title={relation}>
                {relation}
              </span>
            ) : null}
            {expandable ? (
              <button
                type="button"
                className="graph-node__toggle"
                aria-expanded={expanded}
                aria-controls={detailsId}
                aria-label={expanded ? `Hide ${title} details` : `Show ${title} details`}
                onClick={ctx.toggleExpanded}
              >
                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
                  <path
                    d="M4 6l4 4 4-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ) : null}
          </div>
        </div>
        {data.stats ? <p className="graph-node__stats">{data.stats}</p> : null}
      </div>

      <h3 className="graph-node__title">{title}</h3>
      {data.subtitle ? <p className="graph-node__subtitle">{data.subtitle}</p> : null}

      {data.badge ? (
        <div className="graph-node__footer">
          <span className="graph-node__badge">{data.badge}</span>
        </div>
      ) : null}
    </>
  )
}

function StatusIcon({ status }: { status: NodeStatus }) {
  if (status === 'success') {
    return (
      <span className="graph-node__status graph-node__status--success" aria-hidden>
        <svg viewBox="0 0 16 16" width="14" height="14">
          <circle cx="8" cy="8" r="7" fill="currentColor" />
          <path
            d="M4.8 8.2l2.1 2.1 4.3-4.4"
            fill="none"
            stroke="#0d1a12"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="graph-node__status graph-node__status--error" aria-hidden>
        <svg viewBox="0 0 16 16" width="14" height="14">
          <circle cx="8" cy="8" r="7" fill="currentColor" />
          <path
            d="M8 4.5v4.2M8 11.2h.01"
            fill="none"
            stroke="#1a0d0d"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </span>
    )
  }
  return (
    <span className="graph-node__status graph-node__status--idle" aria-hidden>
      <svg viewBox="0 0 16 16" width="14" height="14">
        <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8" cy="8" r="2" fill="currentColor" />
      </svg>
    </span>
  )
}

export function GraphNode<TData>({
  node,
  selected,
  editable,
  role,
  relation,
  dimmed = false,
  onSelect,
  onHoverChange,
  onDragStart,
  onSourceHandleDown,
  onSizeChange,
  expanded,
  onToggleExpanded,
  renderNode,
  renderDetails,
}: GraphNodeProps<TData>) {
  const data = asNodeData(node.data)
  const title = data.title ?? node.id
  const ref = useRef<HTMLDivElement>(null)
  const pressStart = useRef<{ x: number; y: number } | null>(null)
  const hasDetails = Boolean(renderDetails) || (data.details?.length ?? 0) > 0
  const detailsId = `graph-node-details-${node.id}`

  const ctx: NodeRenderContext = {
    editable,
    selected,
    role,
    relation,
    dimmed,
    expanded: !editable && expanded,
    toggleExpanded: () => onToggleExpanded(node.id),
  }
  const customContent = renderNode?.(node, ctx)
  const isCustom = customContent !== undefined
  // A custom card decides what "expanded" shows, so it is always toggleable in view mode.
  const expandable = !editable && (isCustom || hasDetails)

  const statusClass =
    data.status === 'success' ? 'is-success' : data.status === 'error' ? 'is-error' : 'is-idle'

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const report = () => {
      const width = Math.ceil(el.offsetWidth)
      const height = Math.ceil(el.offsetHeight)
      if (width > 0 && height > 0) {
        onSizeChange(node.id, { width, height })
      }
    }

    report()
    const observer = new ResizeObserver(report)
    observer.observe(el)
    return () => observer.disconnect()
  }, [node.id, onSizeChange])

  return (
    <div
      ref={ref}
      className={[
        'graph-node',
        isCustom ? 'graph-node--custom' : statusClass,
        selected && 'is-selected',
        role && role !== 'focus' && `is-${role}`,
        dimmed && 'is-dimmed',
        ctx.expanded && 'is-expanded',
        expandable && 'is-expandable',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: node.width,
      }}
      data-node-id={node.id}
      onPointerEnter={() => onHoverChange(node.id, true)}
      onPointerLeave={() => onHoverChange(node.id, false)}
      onPointerDown={(event) => {
        if ((event.target as HTMLElement).closest('[data-handle]')) return
        // Keep the canvas from panning so a click here can open details.
        event.stopPropagation()
        pressStart.current = { x: event.clientX, y: event.clientY }
        if (!editable) return
        onSelect(node.id)
        onDragStart(node.id, event)
      }}
      onClick={(event) => {
        const start = pressStart.current
        pressStart.current = null
        if (!expandable || !start) return
        if ((event.target as HTMLElement).closest(NO_TOGGLE_SELECTOR)) return
        if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > CLICK_SLOP) return
        onToggleExpanded(node.id)
      }}
    >
      <button
        type="button"
        className="graph-node__handle graph-node__handle--target"
        data-handle="target"
        data-node-id={node.id}
        aria-label={`Connect to ${title}`}
        aria-hidden={!editable || undefined}
        tabIndex={editable ? undefined : -1}
        onPointerDown={(event) => event.stopPropagation()}
      />

      {isCustom ? (
        customContent
      ) : (
        <DefaultCard
          title={title}
          data={data}
          ctx={ctx}
          expandable={expandable}
          detailsId={detailsId}
        />
      )}

      {ctx.expanded && hasDetails ? (
        <div id={detailsId} className="graph-node__details">
          {renderDetails ? renderDetails(node) : <DefaultDetails data={data} />}
        </div>
      ) : null}

      <button
        type="button"
        className="graph-node__handle graph-node__handle--source"
        data-handle="source"
        data-node-id={node.id}
        aria-label={`Connect from ${title}`}
        aria-hidden={!editable || undefined}
        tabIndex={editable ? undefined : -1}
        onPointerDown={(event) => {
          if (editable) onSourceHandleDown(node.id, event)
        }}
      />
    </div>
  )
}
