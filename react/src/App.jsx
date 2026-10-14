import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import CardList from './pages/CardList'
import CardDetail from './pages/CardDetail'
import IframeView from './pages/IframeView'
import './App.css'

function AccessibilityReinit() {
  const location = useLocation()

  useEffect(() => {
    const run = () => window.DWAOAccessibility?.reinit()
    // requestIdleCallback is missing in some browsers (e.g. Safari)
    if ('requestIdleCallback' in window) requestIdleCallback(run)
    else setTimeout(run, 1)
  }, [location.pathname])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AccessibilityReinit />
      <Navbar />
      <Routes>
        <Route path="/" element={<CardList />} />
        <Route path="/cards/:id" element={<CardDetail />} />
        <Route path="/iframe" element={<IframeView />} />
      </Routes>
    </BrowserRouter>
  )
}
