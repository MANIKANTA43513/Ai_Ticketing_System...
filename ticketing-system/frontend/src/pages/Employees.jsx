import { useEffect, useState, useCallback } from 'react'
import { Users, Plus, Edit2, Trash2, X, Check, Loader2 } from 'lucide-react'
import { employeesApi } from '../api'
import toast from 'react-hot-toast'

const DEPARTMENTS = ['Engineering', 'IT', 'HR', 'Finance', 'Legal', 'Marketing']
const AVAILABILITY = ['Available', 'Busy', 'On Leave']

export default function Employees() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', department: 'Engineering', role: '', skill_tags: '', availability: 'Available' })

  const load = useCallback(async () => {
    try {
      const data = await employeesApi.list()
      setEmployees(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function startEdit(emp) {
    setEditId(emp.id)
    setForm({
      name: emp.name,
      email: emp.email,
      department: emp.department,
      role: emp.role,
      skill_tags: JSON.parse(emp.skill_tags || '[]').join(', '),
      availability: emp.availability,
    })
    setShowForm(true)
  }

  function resetForm() {
    setEditId(null)
    setForm({ name: '', email: '', department: 'Engineering', role: '', skill_tags: '', availability: 'Available' })
    setShowForm(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const skills = form.skill_tags.split(',').map(s => s.trim()).filter(Boolean)
    const payload = { ...form, skill_tags: JSON.stringify(skills) }
    try {
      if (editId) {
        await employeesApi.update(editId, payload)
        toast.success('Employee updated')
      } else {
        await employeesApi.create(payload)
        toast.success('Employee added')
      }
      resetForm()
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Operation failed')
    }
  }

  async function deactivate(id, name) {
    if (!confirm(`Deactivate ${name}?`)) return
    try {
      await employeesApi.deactivate(id)
      toast.success(`${name} deactivated`)
      load()
    } catch {
      toast.error('Failed to deactivate')
    }
  }

  const byDept = DEPARTMENTS.reduce((acc, d) => {
    acc[d] = employees.filter(e => e.department === d)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Employee Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5">{employees.length} active employees across {DEPARTMENTS.length} departments</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Add Employee
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">{editId ? 'Edit Employee' : 'Add Employee'}</h2>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Full Name"><input className="input" value={form.name} onChange={e => set('name', e.target.value)} required /></Field>
                <Field label="Email"><input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} required disabled={!!editId} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Department">
                  <select className="input" value={form.department} onChange={e => set('department', e.target.value)}>
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </Field>
                <Field label="Availability">
                  <select className="input" value={form.availability} onChange={e => set('availability', e.target.value)}>
                    {AVAILABILITY.map(a => <option key={a}>{a}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Role / Designation"><input className="input" value={form.role} onChange={e => set('role', e.target.value)} required /></Field>
              <Field label="Skills (comma separated)">
                <input className="input" placeholder="e.g. Python, Database, SQL" value={form.skill_tags} onChange={e => set('skill_tags', e.target.value)} />
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary flex items-center gap-2">
                  <Check size={14} /> {editId ? 'Update' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Department sections */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-slate-200 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {DEPARTMENTS.map(dept => {
            const emps = byDept[dept] || []
            if (emps.length === 0) return null
            return (
              <div key={dept}>
                <h2 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                  <Users size={14} className="text-blue-500" /> {dept}
                  <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{emps.length}</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {emps.map(emp => (
                    <EmployeeCard key={emp.id} emp={emp} onEdit={() => startEdit(emp)} onDeactivate={() => deactivate(emp.id, emp.name)} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EmployeeCard({ emp, onEdit, onDeactivate }) {
  const availColor = emp.availability === 'Available' ? 'bg-green-400' : emp.availability === 'Busy' ? 'bg-orange-400' : 'bg-red-400'
  const skills = JSON.parse(emp.skill_tags || '[]')

  return (
    <div className="card p-4 space-y-3 hover:border-blue-200 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
            {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{emp.name}</p>
            <p className="text-xs text-slate-500 truncate">{emp.role}</p>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onEdit} className="p-1 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600"><Edit2 size={13} /></button>
          <button onClick={onDeactivate} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${availColor}`} />
          <span className="text-slate-600">{emp.availability}</span>
        </div>
        <span className="text-slate-500">Load: <span className="font-medium">{emp.current_load}</span></span>
        <span className="text-slate-500">Avg: <span className="font-medium">{emp.avg_resolution_time}h</span></span>
      </div>

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {skills.slice(0, 4).map(s => (
            <span key={s} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded">{s}</span>
          ))}
          {skills.length > 4 && <span className="text-xs text-slate-400">+{skills.length - 4}</span>}
        </div>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  )
}
