import { useEffect } from 'react'
import { createDemoGraph, GraphCanvas, useColorMode } from './graph'
import './graph/graph.css'
import './App.css'

const demo = createDemoGraph()

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
        <GraphCanvas initialState={demo} colorMode={resolvedMode} />
      </section>
    </main>
  )
}

export default App
