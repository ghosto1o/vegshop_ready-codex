// frontend/src/main.jsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'          // <— คงไว้บรรทัดนี้บรรทัดเดียว
import './styles/index.css'

createRoot(document.getElementById('root')).render(<App />)
