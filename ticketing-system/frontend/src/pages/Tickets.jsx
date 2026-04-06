import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter, RefreshCw } from 'lucide-react'
import { ticketsApi } from '../api'
import { useWebSocket } from '../hooks/useWebSocket'
import TicketCard from '../components/TicketCard'
import toast from 'react-hot-toast'

const STATUSES = ['', 'New', 'Assigned', 'In Progress', 'Pending Info', 'Resolved', 'Closed']
const SEVERITIES = ['', 'Critical', 'High', 'Medium', 'Low']
const CATEGORIES = ['', 'Billing', 'Bug', 'Access', 'HR', 'Server', 'DB', 'Feature', 'Other']

export default function Tickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [severity, setSeverity] = useState('')
  const [category, setCategory] = useState('')
  const [newCount, setNewCount] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await ticketsApi.list({ status: status || undefined, severity: severity || undefined, category: category || undefined, search: search || undefined })
      setTickets(data)
      setNewCount(0)
    } finally {
      setLoading(false)
    }
  }, [status, severity, category, search])

  useEffect(() => { load() }, [load])

  useWebSocket((msg) => {
    if (msg.type === 'ticket_created') {
      setNewCount(c => c + 1)
    }
    if (msg.type === 'ticket_updated') {
      setTickets(prev => prev.map(t => t.id === msg.ticket.id ? { ...t, ...msg.ticket } : t))
    }
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tickets</h1>
          <p className="text-sm text-slate-500 mt-0.5">{tickets.length} tickets found</p>
        </div>
        <Link to="/tickets/new" className="btn-primary flex items-center gap-2 shrink-0">
          <Plus size={15} /> New Ticket
        </Link>
      </div>

      {/* New tickets banner */}
      {newCount > 0 && (
        <button
          onClick={load}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors slide-in"
        >
          <RefreshCw size={14} /> {newCount} new ticket{newCount > 1 ? 's' : ''} — click to refresh
        </button>
      )}

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-8"
              placeholder="Search tickets..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={status} onChange={setStatus} options={STATUSES} placeholder="All Statuses" />
          <Select value={severity} onChange={setSeverity} options={SEVERITIES} placeholder="All Severities" />
          <Select value={category} onChange={setCategory} options={CATEGORIES} placeholder="All Categories" />
        </div>
        {(status || severity || category || search) && (
          <button
            onClick={() => { setStatus(''); setSeverity(''); setCategory(''); setSearch('') }}
            className="text-xs text-blue-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-28 bg-slate-200 rounded-xl animate-pulse" />)}
        </div>
      ) : tickets.length > 0 ? (
        <div className="space-y-3">
          {tickets.map(t => <TicketCard key={t.id} ticket={t} />)}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <p className="text-slate-400 text-sm mb-2">No tickets found.</p>
          <Link to="/tickets/new" className="text-blue-600 text-sm hover:underline">Create your first ticket →</Link>
        </div>
      )}
    </div>
  )
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select className="input" value={value} onChange={e => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.filter(Boolean).map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}
