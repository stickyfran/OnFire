import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Auto-actualización inmediata del Service Worker para evitar caché vieja
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] Nueva versión lista, actualizando...')
    window.location.reload(true)
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
