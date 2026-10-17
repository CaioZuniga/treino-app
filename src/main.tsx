import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fontes empacotadas no app (só o alfabeto latino): funcionam offline e não dependem do Google Fonts.
import '@fontsource/unbounded/latin-500.css'
import '@fontsource/unbounded/latin-700.css'
import '@fontsource/manrope/latin-400.css'
import '@fontsource/manrope/latin-500.css'
import '@fontsource/manrope/latin-600.css'
import '@fontsource/manrope/latin-700.css'
import '@fontsource/jetbrains-mono/latin-500.css'
import './index.css'
import App from './App.tsx'
import { initPlatform } from './state/platform'

initPlatform()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
