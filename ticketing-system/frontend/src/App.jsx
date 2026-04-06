import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Tickets from './pages/Tickets'
import NewTicket from './pages/NewTicket'
import TicketDetail from './pages/TicketDetail'
import Employees from './pages/Employees'
import Analytics from './pages/Analytics'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1e40af', color: '#fff', borderRadius: '10px' },
        success: { style: { background: '#166534', color: '#fff' } },
        error: { style: { background: '#991b1b', color: '#fff' } },
      }} />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="tickets/new" element={<NewTicket />} />
          <Route path="tickets/:id" element={<TicketDetail />} />
          <Route path="employees" element={<Employees />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
