import { createDemoGraph, GraphCanvas } from './graph'
import './graph/graph.css'
import './App.css'

const demo = createDemoGraph()

function App() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>edge-node</h1>
        <p>Node connection editor</p>
      </header>
      <section className="app-canvas">
        <GraphCanvas initialState={demo} />
      </section>
    </main>
  )
}

export default App
