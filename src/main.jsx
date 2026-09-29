import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const root = createRoot(document.getElementById('root'))
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
)

const run = () => window.DWAOAccessibility?.reinit()
// requestIdleCallback is missing in some browsers (e.g. Safari)
if ('requestIdleCallback' in window) requestIdleCallback(run)
else setTimeout(run, 1)
