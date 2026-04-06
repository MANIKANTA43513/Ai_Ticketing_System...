import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, Send, ArrowLeft, Loader2 } from 'lucide-react'
import { ticketsApi } from '../api'
import toast from 'react-hot-toast'

const EXAMPLE_TICKETS = [
  { title: 'Cannot access my email account', description: 'My email account has been locked since this morning. I have tried resetting the password but the reset link is not working. I need urgent access for an important client meeting.' },
  { title: 'Server down in production', description: 'Our main production server (prod-web-01) is completely unresponsive since 2:00 AM. The database is corrupted and customers cannot access the application. This is a critical P1 issue!' },
  { title: 'How to apply for annual leave?', description: 'I am new to the company and need to understand the leave application process. Can you guide me through the steps to apply for 5 days of annual leave next month?' },
  { title: 'Salary not credited for October', description: 'My October salary has not been credited to my bank account yet. It is usually done by the 5th. Please check what is wrong and process it urgently.' },
]

export default function NewTicket() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', description: '', reporter_email: '', reporter_name: '' })
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim() || !form.reporter_email.trim()) {
      toast.error('Please fill all required fields')
      return
    }
    setLoading(true)
    try {
      const ticket = await ticketsApi.create(form)
      toast.success('Ticket submitted! AI is analyzing...')
      navigate(`/tickets/${ticket.id}`)
    } catch (err) {
      toast.error('Failed to submit ticket. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function fillExample(ex) {
    setForm(f => ({ ...f, title: ex.title, description: ex.description }))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">New Support Ticket</h1>
          <p className="text-sm text-slate-500">AI will analyze and route your ticket instantly</p>
        </div>
      </div>

      {/* AI badge */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Brain size={20} className="text-blue-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Powered by Claude AI</p>
          <p className="text-xs text-blue-600 mt-0.5">
            Your ticket will be automatically analyzed, categorized, and routed to the best available agent.
            Simple issues may be resolved instantly.
          </p>
        </div>
      </div>

      {/* Example tickets */}
      <div>
        <p className="text-xs text-slate-500 font-medium mb-2">Try an example:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_TICKETS.map((ex, i) => (
            <button
              key={i}
              onClick={() => fillExample(ex)}
              className="text-xs px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              {ex.title}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Your Name" required={false}>
            <input className="input" placeholder="John Doe" value={form.reporter_name} onChange={e => set('reporter_name', e.target.value)} />
          </Field>
          <Field label="Email Address" required>
            <input className="input" type="email" placeholder="you@company.com" value={form.reporter_email} onChange={e => set('reporter_email', e.target.value)} required />
          </Field>
        </div>

        <Field label="Issue Title" required>
          <input
            className="input"
            placeholder="Brief description of your issue..."
            value={form.title}
            onChange={e => set('title', e.target.value)}
            required
          />
        </Field>

        <Field label="Detailed Description" required>
          <textarea
            className="input resize-none"
            rows={5}
            placeholder="Describe your issue in detail. Include any error messages, steps to reproduce, and impact on your work..."
            value={form.description}
            onChange={e => set('description', e.target.value)}
            required
          />
          <p className="text-xs text-slate-400 mt-1">More detail = better AI analysis and faster resolution</p>
        </Field>

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Submitting & Analyzing with AI...
            </>
          ) : (
            <>
              <Send size={16} />
              Submit Ticket
            </>
          )}
        </button>
      </form>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}
