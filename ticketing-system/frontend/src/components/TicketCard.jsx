import { Link } from 'react-router-dom'
import { Clock, User, Zap, ChevronRight } from 'lucide-react'
import { StatusBadge, SeverityBadge, CategoryBadge } from './StatusBadge'
import { formatDistanceToNow } from 'date-fns'

export default function TicketCard({ ticket }) {
  const isAuto = ticket.resolution_path === 'auto-resolve'

  return (
    <Link to={`/tickets/${ticket.id}`} className="card p-4 hover:shadow-md hover:border-blue-200 transition-all duration-150 block group slide-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="text-xs text-slate-400 font-mono">#{ticket.id}</span>
            {ticket.category && <CategoryBadge category={ticket.category} />}
            <SeverityBadge severity={ticket.severity} />
            {isAuto && (
              <span className="badge bg-purple-100 text-purple-700 gap-1">
                <Zap size={9} /> Auto
              </span>
            )}
          </div>

          <h3 className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 truncate leading-snug">
            {ticket.title}
          </h3>

          {/* AI Summary preview */}
          {ticket.ai_summary && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {ticket.ai_summary}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center gap-3 mt-2.5 flex-wrap">
            <StatusBadge status={ticket.status} />
            {ticket.department && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <User size={11} /> {ticket.department}
              </span>
            )}
            {ticket.created_at && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Clock size={11} />
                {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>

        <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-400 shrink-0 mt-1 transition-colors" />
      </div>
    </Link>
  )
}
