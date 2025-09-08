import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './fallback.css'
import App from './App.tsx'

// Import Heroicons for better tree-shaking
import '@heroicons/react/24/outline'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
