import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { HashRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async';
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <HelmetProvider>
    <HashRouter>
      <App />
    </HashRouter>
  </HelmetProvider>
)
