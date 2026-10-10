import type { GraphNode, NodeRenderContext } from './graph'
import type { DemoNodeData } from './demoGraph'

type IntegrationCardProps = {
  node: GraphNode<DemoNodeData>
  ctx: NodeRenderContext
}

/** Demo of a fully custom node card drawn through `renderNode`. */
export function IntegrationCard({ node, ctx }: IntegrationCardProps) {
  const { title, integration } = node.data
  if (!integration) return null

  return (
    <div className="integration-card">
      <div className="integration-card__head">
        <span className="integration-card__logo" aria-hidden>
          {integration.service.slice(0, 1)}
        </span>
        <div className="integration-card__titles">
          <h3>{title}</h3>
          <p>{integration.service} integration</p>
        </div>
        {ctx.relation ? (
          <span className={`integration-card__role is-${ctx.role}`} title={ctx.relation}>
            {ctx.relation}
          </span>
        ) : null}
      </div>

      <dl className="integration-card__stats">
        <div>
          <dt>Channel</dt>
          <dd>{integration.channel}</dd>
        </div>
        <div>
          <dt>Recipients</dt>
          <dd>{integration.recipients}</dd>
        </div>
      </dl>

      {ctx.expanded ? (
        <blockquote className="integration-card__message">{integration.lastMessage}</blockquote>
      ) : null}

      {!ctx.editable ? (
        <button type="button" className="integration-card__toggle" onClick={ctx.toggleExpanded}>
          {ctx.expanded ? 'Hide last message' : 'Show last message'}
        </button>
      ) : null}
    </div>
  )
}
