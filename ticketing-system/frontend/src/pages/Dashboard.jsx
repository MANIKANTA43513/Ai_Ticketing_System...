import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Ticket, CheckCircle, Zap, AlertTriangle, Plus, TrendingUp } from 'lucide-react'
import { ticketsApi, analyticsApi } from '../api'
import { useWebSocket } from '../hooks/useWebSocket'
import TicketCard from '../components/TicketCard'
import StatCard from '../components/StatCard'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const PIE_COLORS = ['#2563eb','#16a34a','#d97706','#dc2626','#7c3aed','#0891b2']

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [recentTickets, setRecentTickets] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [a, t] = await Promise.all([analyticsApi.get(), ticketsApi.list({})])
      setAnalytics(a)
      setRecentTickets(t.slice(0, 5))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useWebSocket((msg) => {
    if (msg.type === 'ticket_created' || msg.type === 'ticket_updated') load()
  })

  const deptData = analytics
    ? Object.entries(analytics.department_load).map(([k, v]) => ({ name: k, tickets: v }))
    : []

  const sevData = analytics
    ? Object.entries(analytics.severity_breakdown).map(([k, v]) => ({ name: k, value: v }))
    : []

  if (loading) return <LoadingScreen />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">AI-powered ticket intelligence overview</p>
        </div>
        <Link to="/tickets/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Ticket
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tickets" value={analytics?.total_tickets} icon={Ticket} color="blue" />
        <StatCard label="Open" value={analytics?.open_tickets} icon={AlertTriangle} color="orange" />
        <StatCard label="Resolved" value={analytics?.resolved_tickets} icon={CheckCircle} color="green" />
        <StatCard
          label="Auto-resolved"
          value={analytics?.auto_resolved}
          icon={Zap}
          color="purple"
          sub={`${analytics?.auto_resolution_success_rate}% success rate`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department load bar chart */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <TrendingUp size={15} className="text-blue-500" /> Department Load
          </h2>
          {deptData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={deptData} barSize={28}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="tickets" fill="#2563eb" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty text="No department data yet" />}
        </div>

        {/* Severity pie */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <AlertTriangle size={15} className="text-orange-500" /> Severity Breakdown
          </h2>
          {sevData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={sevData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {sevData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <Empty text="No severity data yet" />}
        </div>
      </div>

      {/* Top categories */}
      {analytics?.top_categories?.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Top Categories This Week</h2>
          <div className="flex flex-wrap gap-2">
            {analytics.top_categories.map((c, i) => (
              <div key={i} className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
                <span className="text-xs font-semibold text-blue-700">{c.category}</span>
                <span className="text-xs bg-blue-600 text-white rounded-full px-1.5 py-0.5 min-w-[20px] text-center">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent tickets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">Recent Tickets</h2>
          <Link to="/tickets" className="text-xs text-blue-600 hover:underline">View all →</Link>
        </div>
        <div className="space-y-3">
          {recentTickets.length > 0
            ? recentTickets.map(t => <TicketCard key={t.id} ticket={t} />)
            : <div className="card p-8 text-center text-slate-400 text-sm">No tickets yet. <Link to="/tickets/new" className="text-blue-500 hover:underline">Create one!</Link></div>
          }
        </div>
      </div>
    </div>
  )
}

function Empty({ text }) {
  return <div className="h-48 flex items-center justify-center text-slate-400 text-sm">{text}</div>
}

function LoadingScreen() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => <div key={i} className="h-64 bg-slate-200 rounded-xl" />)}
      </div>
    </div>
  )
}
