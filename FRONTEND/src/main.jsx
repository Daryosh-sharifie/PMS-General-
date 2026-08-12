import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './Components/ui/ErrorBoundary'
import "@fontsource/vazirmatn"; // default weight
import "@fontsource/vazirmatn/400.css";
import "@fontsource/vazirmatn/500.css";
import "@fontsource/vazirmatn/700.css";
import { LanguageProvider } from './i18n/LanguageContext.jsx'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
      <LanguageProvider>
        <App />
      </LanguageProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)

