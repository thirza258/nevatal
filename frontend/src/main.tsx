
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)

/*
 * Register the service worker, which is what makes the app installable and
 * lets the shell open without a network.
 *
 * Production only: in dev the worker would sit in front of Vite's own module
 * serving and cache modules that change on every save.
 */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // No worker means no offline shell, which is not worth telling anyone.
    })
  })
}
