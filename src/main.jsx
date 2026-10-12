import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import Login from './Login.jsx'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js' 
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Dashboard from './components/Dashboard.jsx'
import Carros from './components/Carros.jsx'
import Alugueis from './components/Alugueis.jsx'
import Clientes from './components/Clientes.jsx'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: "/dashboard",
    element: (
    <ProtectedRoute>
      <Dashboard />
      </ProtectedRoute>
    )
  },
  {
    path: "/carros",
    element: (
      <ProtectedRoute>
        <Carros />
      </ProtectedRoute>
    )
  },
  {
    path: "/alugueis", 
    element: ( <ProtectedRoute><Alugueis /></ProtectedRoute> )
  },
  {
    path:"/clientes",
    element: ( <ProtectedRoute><Clientes /></ProtectedRoute> )
  },
  {
    path: "/",
    element: <Login />
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
