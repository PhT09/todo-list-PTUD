import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// PrimeReact Theme & Core - Blue theme
import 'primereact/resources/themes/lara-light-blue/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'

// Tailwind + custom overrides
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
