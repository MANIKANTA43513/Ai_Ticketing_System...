import { Outlet } from 'react-router-dom'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Ticket, Plus, Users, BarChart3,
  Zap, Circle, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tickets', icon: Ticket, label: 'Tickets' },
  { to: '/tickets/new', icon: Plus, label: 'New Ticket' },
  { to: '/employees', icon: Users, label: 'Employees' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  const connected = useWebSocket((msg) => {
    if (msg.type === 'ticket_created') {
      toast(`🎫 New ticket: ${msg.ticket.title}`, {
        duration: 4000,
        style: { background: '#1e40af', color: '#fff' },
        onClick: () => navigate(`/tickets/${msg.ticket.id}`)
      })
    }
    if (msg.type === 'ticket_updated') {
      toast(`🔄 Ticket #${msg.ticket.id} → ${msg.ticket.status}`, {
        duration: 3000,
        style: { background: '#0f4c81', color: '#fff' },
      })
    }
  })

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-brand-900 text-white flex flex-col transition-transform duration-300
        lg:static lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-brand-800">
          <div className="bg-blue-500 rounded-lg p-1.5">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">AI Ticketing</p>
            <p className="text-blue-300 text-xs">Smart Support System</p>
          </div>
          <button className="ml-auto lg:hidden text-blue-300" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-blue-200 hover:bg-brand-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Connection status */}
        <div className="px-4 py-4 border-t border-brand-800">
          <div className="flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 live-pulse' : 'bg-red-400'}`} />
            <span className={connected ? 'text-green-300' : 'text-red-300'}>
              {connected ? 'Live Updates Active' : 'Reconnecting...'}
            </span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3 shrink-0">
          <button className="lg:hidden p-1 rounded-lg text-slate-500 hover:bg-slate-100" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${
              connected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
            }`}>
              <Circle size={6} className={connected ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'} />
              {connected ? 'Live' : 'Offline'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
