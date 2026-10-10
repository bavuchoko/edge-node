import { useEffect, useState } from 'react'
import {
  GraphCanvas,
  useColorMode,
  type GraphEdge,
  type GraphNode,
  type RenderNode,
} from './graph'
import { createDemoGraph, type DemoNodeData } from './demoGraph'
import { IntegrationCard } from './IntegrationCard'
import './graph/graph.css'
import './App.css'

const demo = createDemoGraph()

/** Demo stand-in for a real API (e.g. `fetch('/api/edges', { method: 'POST', ... })`). */
async function fakeRequest(action: string, payload: unknown) {
  await new Promise((resolve) => setTimeout(resolve, 400))
  console.info(`[demo api] ${action}`, payload)
}

const graphApi = {
  onConnect: (edge: GraphEdge) => fakeRequest('POST /edges', edge),
  onEdgeUpdate: (edge: GraphEdge) => fakeRequest(`PATCH /edges/${edge.id}`, edge),
  onEdgeDelete: (edge: GraphEdge) => fakeRequest(`DELETE /edges/${edge.id}`, edge),
  onNodeMove: (node: GraphNode<DemoNodeData>) =>
    fakeRequest(`PATCH /nodes/${node.id}`, { position: node.position }),
}

/** Integration nodes get a custom card; everything else keeps the built-in one. */
const renderNode: RenderNode<DemoNodeData> = (node, ctx) =>
  node.data.integration ? <IntegrationCard node={node} ctx={ctx} /> : undefined

function App() {
  const { resolvedMode, toggle } = useColorMode({ storageKey: 'edge-node:theme' })
  const nextMode = resolvedMode === 'dark' ? 'light' : 'dark'
  const [editable, setEditable] = useState(true)

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedMode
  }, [resolvedMode])

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>edge-node</h1>
        <p>Node connection editor</p>
        <div className="app-header-actions">
          <button
            type="button"
            className="app-header-button"
            aria-pressed={editable}
            title={editable ? 'Switch to view-only mode' : 'Switch to edit mode'}
            onClick={() => setEditable((value) => !value)}
          >
            {editable ? '✎ Editing' : '◉ Viewing'}
          </button>
          <button
            type="button"
            className="app-header-button"
            onClick={toggle}
            aria-label={`Switch to ${nextMode} mode`}
            title={`Switch to ${nextMode} mode`}
          >
            {resolvedMode === 'dark' ? '☀︎ Light' : '☾ Dark'}
          </button>
        </div>
      </header>
      <section className="app-canvas">
        <GraphCanvas
          initialState={demo}
          colorMode={resolvedMode}
          editable={editable}
          renderNode={renderNode}
          {...graphApi}
        />
      </section>
    </main>
  )
}

export default App
