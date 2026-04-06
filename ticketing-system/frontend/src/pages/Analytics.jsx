import { useEffect, useState, useCallback } from 'react'
import { BarChart3, Zap, Clock, Target, TrendingUp, CheckCircle, AlertTriangle, Ticket } from 'lucide-react'
import { analyticsApi } from '../api'
import { useWebSocket } from '../hooks/useWebSocket'
import StatCard from '../components/StatCard'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts'

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#be185d']
const STATUS_COLORS = {
  'New': '#64748b', 'Assigned': '#2563eb', 'In Progress': '#d97706',
  'Pending Info': '#ea580c', 'Resolved': '#16a34a', 'Closed': '#94a3b8'
}

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const d = await analyticsApi.get()
      setData(d)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useWebSocket((msg) => {
    if (msg.type === 'ticket_created' || msg.type === 'ticket_updated') load()
  })

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded-xl" />)}
      </div>
      {[...Array(3)].map((_, i) => <div key={i} className="h-64 bg-slate-200 rounded-xl" />)}
    </div>
  )

  if (!data) return null

  const deptData = Object.entries(data.department_load).map(([k, v]) => ({ name: k, tickets: v }))
  const sevData = Object.entries(data.severity_breakdown).map(([k, v]) => ({ name: k, value: v }))
  const statusData = Object.entries(data.tickets_by_status).map(([k, v]) => ({ name: k, value: v, fill: STATUS_COLORS[k] || '#64748b' }))
  const dailyData = Object.entries(data.daily_tickets).map(([k, v]) => ({ date: k.slice(5), tickets: v }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Analytics Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Live metrics across all 6 modules</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tickets" value={data.total_tickets} icon={Ticket} color="blue" />
        <StatCard label="Open Tickets" value={data.open_tickets} icon={AlertTriangle} color="orange" />
        <StatCard label="Resolved" value={data.resolved_tickets} icon={CheckCircle} color="green" />
        <StatCard label="Escalated" value={data.escalated} icon={TrendingUp} color="red" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Auto-Resolved" value={data.auto_resolved} icon={Zap} color="purple" />
        <StatCard
          label="AI Success Rate"
          value={`${data.auto_resolution_success_rate}%`}
          icon={Target}
          color="green"
          sub="Auto-resolved marked helpful"
        />
        <StatCard
          label="Avg Resolution"
          value={Object.keys(data.avg_resolution_by_dept).length + ' depts'}
          icon={Clock}
          color="blue"
          sub="Tracked across departments"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Department Load (Open Tickets)" icon={<BarChart3 size={14} className="text-blue-500" />}>
          {deptData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="tickets" fill="#2563eb" radius={[5, 5, 0, 0]} label={{ position: 'top', fontSize: 11, fill: '#64748b' }} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Severity Breakdown" icon={<AlertTriangle size={14} className="text-orange-500" />}>
          {sevData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={sevData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={true}
                  fontSize={11}
                >
                  {sevData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Tickets by Status" icon={<CheckCircle size={14} className="text-green-500" />}>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusData} layout="vertical" barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="value" radius={[0, 5, 5, 0]}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Daily Ticket Volume (Last 7 Days)" icon={<TrendingUp size={14} className="text-blue-500" />}>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Line type="monotone" dataKey="tickets" stroke="#2563eb" strokeWidth={2.5} dot={{ fill: '#2563eb', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
      </div>

      {/* Top categories + Avg resolution time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Top 5 Categories This Week" icon={<Target size={14} className="text-purple-500" />}>
          {data.top_categories.length > 0 ? (
            <div className="space-y-2.5 mt-2">
              {data.top_categories.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-600 w-24 shrink-0">{c.category}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${(c.count / (data.top_categories[0]?.count || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-blue-600 w-6 text-right">{c.count}</span>
                </div>
              ))}
            </div>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Avg Resolution Time by Department" icon={<Clock size={14} className="text-blue-500" />}>
          {Object.keys(data.avg_resolution_by_dept).length > 0 ? (
            <div className="space-y-2.5 mt-2">
              {Object.entries(data.avg_resolution_by_dept).sort((a, b) => b[1] - a[1]).map(([dept, hrs], i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-600 w-24 shrink-0 truncate">{dept}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all duration-500"
                      style={{ width: `${Math.min((hrs / 20) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-green-600 w-12 text-right">{hrs}h</span>
                </div>
              ))}
            </div>
          ) : <EmptyChart />}
        </ChartCard>
      </div>
    </div>
  )
}

function ChartCard({ title, icon, children }) {
  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
        {icon} {title}
      </h2>
      {children}
    </div>
  )
}

function EmptyChart() {
  return <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data yet — submit some tickets!</div>
}
