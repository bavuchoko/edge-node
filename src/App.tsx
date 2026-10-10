import { useEffect } from 'react'
import { GraphCanvas, useColorMode, type GraphEdge, type GraphNode } from './graph'
import { createDemoGraph } from './demoGraph'
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
  onNodeMove: (node: GraphNode) =>
    fakeRequest(`PATCH /nodes/${node.id}`, { position: node.position }),
}

function App() {
  const { resolvedMode, toggle } = useColorMode({ storageKey: 'edge-node:theme' })
  const nextMode = resolvedMode === 'dark' ? 'light' : 'dark'

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedMode
  }, [resolvedMode])

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>edge-node</h1>
        <p>Node connection editor</p>
        <button
          type="button"
          className="app-theme-toggle"
          onClick={toggle}
          aria-label={`Switch to ${nextMode} mode`}
          title={`Switch to ${nextMode} mode`}
        >
          {resolvedMode === 'dark' ? '☀︎ Light' : '☾ Dark'}
        </button>
      </header>
      <section className="app-canvas">
        <GraphCanvas initialState={demo} colorMode={resolvedMode} {...graphApi} />
      </section>
    </main>
  )
}

export default App
