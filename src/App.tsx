import { createDemoGraph, GraphCanvas, type GraphTheme } from './graph'
import './graph/graph.css'
import './App.css'

const demo = createDemoGraph()

/** Partial theme — omit fields to keep defaults. */
const theme: GraphTheme = {
  background: '#141414',
  gridColor: 'rgba(255, 255, 255, 0.04)',
  node: {
    background: '#1e1e1e',
    border: '#2e2e2e',
    title: '#f9fafb',
    subtitle: '#6b7280',
  },
  edge: {
    color: '#6b7280',
    width: 2,
    selectedColor: '#93c5fd',
    selectedWidth: 3,
    hitWidth: 32,
  },
}

function App() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>edge-node</h1>
        <p>Node connection editor</p>
      </header>
      <section className="app-canvas">
        <GraphCanvas initialState={demo} theme={theme} />
      </section>
    </main>
  )
}

export default App
