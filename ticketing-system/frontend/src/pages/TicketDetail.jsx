import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Clock, MessageSquare, RefreshCw, Send, UserCheck, Loader2 } from 'lucide-react'
import { ticketsApi, employeesApi } from '../api'
import { useWebSocket } from '../hooks/useWebSocket'
import { StatusBadge, SeverityBadge } from '../components/StatusBadge'
import AIAnalysisCard from '../components/AIAnalysisCard'
import { formatDistanceToNow, format } from 'date-fns'
import toast from 'react-hot-toast'

const STATUSES = ['New', 'Assigned', 'In Progress', 'Pending Info', 'Resolved', 'Closed']

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState('')
  const [actor, setActor] = useState('Agent')
  const [updating, setUpdating] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedAssignee, setSelectedAssignee] = useState('')

  const load = useCallback(async () => {
    try {
      const [t, emps] = await Promise.all([ticketsApi.get(id), employeesApi.list()])
      setTicket(t)
      setEmployees(emps)
      setSelectedStatus(t.status)
      setSelectedAssignee(t.assigned_to || '')
    } catch {
      toast.error('Ticket not found')
      navigate('/tickets')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  useWebSocket((msg) => {
    if ((msg.type === 'ticket_updated' || msg.type === 'feedback') && String(msg.ticket?.id || msg.ticket_id) === String(id)) {
      load()
    }
  })

  async function handleUpdate() {
    if (!note.trim() && selectedStatus === ticket.status && Number(selectedAssignee) === ticket.assigned_to) {
      toast.error('No changes to save')
      return
    }
    setUpdating(true)
    try {
      await ticketsApi.update(id, {
        status: selectedStatus !== ticket.status ? selectedStatus : undefined,
        assigned_to: selectedAssignee && Number(selectedAssignee) !== ticket.assigned_to ? Number(selectedAssignee) : undefined,
        note: note.trim() || undefined,
        actor,
      })
      toast.success('Ticket updated')
      setNote('')
      load()
    } catch {
      toast.error('Update failed')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return (
    <div className="space-y-4 animate-pulse max-w-4xl mx-auto">
      <div className="h-8 bg-slate-200 rounded w-64" />
      <div className="h-48 bg-slate-200 rounded-xl" />
      <div className="h-64 bg-slate-200 rounded-xl" />
    </div>
  )

  if (!ticket) return null

  const assignedEmp = employees.find(e => e.id === ticket.assigned_to)
  const suggestedEmp = employees.find(e => e.id === ticket.suggested_employee_id)

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => navigate('/tickets')} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 mt-1">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs text-slate-400 font-mono">Ticket #{ticket.id}</span>
            <StatusBadge status={ticket.status} />
            <SeverityBadge severity={ticket.severity} />
          </div>
          <h1 className="text-xl font-bold text-slate-800 leading-tight">{ticket.title}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Submitted by <span className="font-medium">{ticket.reporter_name}</span> ({ticket.reporter_email}) ·{' '}
            {ticket.created_at && formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left col: main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Original description */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <MessageSquare size={14} className="text-blue-500" /> Issue Description
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* AI Analysis */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <span className="text-blue-500">🤖</span> AI Analysis
            </h2>
            <AIAnalysisCard ticket={ticket} onUpdate={load} />
          </div>

          {/* Update panel */}
          <div className="card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <RefreshCw size={14} className="text-blue-500" /> Update Ticket
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                <select className="input" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Assign to</label>
                <select className="input" value={selectedAssignee} onChange={e => setSelectedAssignee(e.target.value)}>
                  <option value="">— Unassigned —</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.department}) {e.availability !== 'Available' ? `[${e.availability}]` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Internal Note</label>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="Add an internal note or request more info from the user..."
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                className="input max-w-[160px]"
                placeholder="Your name"
                value={actor}
                onChange={e => setActor(e.target.value)}
              />
              <button
                onClick={handleUpdate}
                disabled={updating}
                className="btn-primary flex items-center gap-2"
              >
                {updating ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Save Update
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Activity Timeline</h2>
            {ticket.timeline?.length > 0 ? (
              <div className="space-y-3">
                {[...ticket.timeline].reverse().map((entry) => (
                  <div key={entry.id} className="flex gap-3 slide-in">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock size={12} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-700">{entry.action}</span>
                        <span className="text-xs text-slate-400">by {entry.actor}</span>
                        <span className="text-xs text-slate-400 ml-auto">
                          {entry.created_at && format(new Date(entry.created_at), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      {entry.note && (
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed bg-slate-50 rounded-lg px-2.5 py-1.5 mt-1">
                          {entry.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">No timeline entries yet.</p>
            )}
          </div>
        </div>

        {/* Right col: sidebar info */}
        <div className="space-y-4">
          {/* Assigned employee */}
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Assigned To</h3>
            {assignedEmp ? (
              <EmployeeInfo emp={assignedEmp} label="Current Assignee" />
            ) : (
              <p className="text-sm text-slate-400 italic">Unassigned</p>
            )}
            {suggestedEmp && suggestedEmp.id !== ticket.assigned_to && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-2">AI Suggestion</p>
                <EmployeeInfo emp={suggestedEmp} label="Suggested" highlight />
              </div>
            )}
          </div>

          {/* Ticket meta */}
          <div className="card p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Details</h3>
            <MetaRow label="Department" value={ticket.department || '—'} />
            <MetaRow label="Category" value={ticket.category || '—'} />
            <MetaRow label="Est. Time" value={ticket.estimated_resolution_time || '—'} />
            <MetaRow label="Confidence" value={ticket.confidence_score ? `${Math.round(ticket.confidence_score * 100)}%` : '—'} />
            <MetaRow label="Created" value={ticket.created_at ? format(new Date(ticket.created_at), 'MMM d, yyyy') : '—'} />
          </div>
        </div>
      </div>
    </div>
  )
}

function EmployeeInfo({ emp, label, highlight }) {
  const avail = emp.availability
  const availColor = avail === 'Available' ? 'text-green-600 bg-green-50' : avail === 'Busy' ? 'text-orange-600 bg-orange-50' : 'text-red-600 bg-red-50'
  return (
    <div className={`rounded-lg p-3 ${highlight ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50'}`}>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
          {emp.name[0]}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{emp.name}</p>
          <p className="text-xs text-slate-500 truncate">{emp.role}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${availColor}`}>{avail}</span>
        <span className="text-xs text-slate-400">Load: {emp.current_load}</span>
      </div>
    </div>
  )
}

function MetaRow({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-medium text-slate-700">{value}</span>
    </div>
  )
}
