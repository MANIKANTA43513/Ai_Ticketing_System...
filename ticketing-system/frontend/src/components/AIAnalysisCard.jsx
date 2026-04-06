import { Brain, ThumbsUp, ThumbsDown, CheckCircle, ArrowRight, Clock, Target, Zap } from 'lucide-react'
import { SeverityBadge, SentimentBadge, CategoryBadge } from './StatusBadge'
import { ticketsApi } from '../api'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function AIAnalysisCard({ ticket, onUpdate }) {
  const [fbLoading, setFbLoading] = useState(false)

  const isAutoResolved = ticket.resolution_path === 'auto-resolve'
  const conf = ticket.confidence_score ? Math.round(ticket.confidence_score * 100) : null

  async function submitFeedback(helpful) {
    setFbLoading(true)
    try {
      await ticketsApi.feedback(ticket.id, helpful)
      toast.success(helpful ? 'Thanks for the positive feedback!' : 'We\'ll improve this response.')
      onUpdate?.()
    } catch {
      toast.error('Failed to submit feedback')
    } finally {
      setFbLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* AI Summary — blue highlighted box */}
      {ticket.ai_summary && (
        <div className="bg-blue-600 rounded-xl p-4 text-white slide-in">
          <div className="flex items-center gap-2 mb-2">
            <Brain size={16} className="text-blue-200" />
            <span className="text-sm font-semibold text-blue-100">AI Analysis Summary</span>
            {conf && (
              <span className="ml-auto text-xs bg-blue-500 px-2 py-0.5 rounded-full text-white">
                {conf}% confidence
              </span>
            )}
          </div>
          <p className="text-sm text-white leading-relaxed font-medium">
            {ticket.ai_summary}
          </p>
        </div>
      )}

      {/* Analysis Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <AnalysisItem label="Category" value={<CategoryBadge category={ticket.category} />} />
        <AnalysisItem label="Severity" value={<SeverityBadge severity={ticket.severity} />} />
        <AnalysisItem label="Sentiment" value={<SentimentBadge sentiment={ticket.sentiment} />} />
        <AnalysisItem
          label="Resolution"
          value={
            <span className={`badge ${isAutoResolved ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
              {isAutoResolved ? '⚡ Auto' : '👤 Assign'}
            </span>
          }
        />
      </div>

      {/* Details row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ticket.suggested_department && (
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2.5">
            <ArrowRight size={15} className="text-blue-500 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Routed to</p>
              <p className="text-sm font-semibold text-slate-800">{ticket.suggested_department}</p>
            </div>
          </div>
        )}
        {ticket.estimated_resolution_time && (
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2.5">
            <Clock size={15} className="text-blue-500 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Est. resolution</p>
              <p className="text-sm font-semibold text-slate-800">{ticket.estimated_resolution_time}</p>
            </div>
          </div>
        )}
      </div>

      {/* Auto-response box */}
      {isAutoResolved && ticket.auto_response && (
        <div className="border border-green-200 rounded-xl p-4 bg-green-50">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={16} className="text-green-600" />
            <span className="text-sm font-semibold text-green-800">Auto-Resolution Response</span>
          </div>
          <p className="text-sm text-green-900 leading-relaxed whitespace-pre-wrap">
            {ticket.auto_response}
          </p>

          {/* Feedback */}
          <div className="mt-4 pt-3 border-t border-green-200">
            <p className="text-xs text-green-700 mb-2 font-medium">Was this helpful?</p>
            {ticket.helpful_feedback === null || ticket.helpful_feedback === undefined ? (
              <div className="flex gap-2">
                <button
                  disabled={fbLoading}
                  onClick={() => submitFeedback(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <ThumbsUp size={12} /> Yes
                </button>
                <button
                  disabled={fbLoading}
                  onClick={() => submitFeedback(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <ThumbsDown size={12} /> No
                </button>
              </div>
            ) : (
              <span className={`text-xs font-medium ${ticket.helpful_feedback ? 'text-green-600' : 'text-red-600'}`}>
                {ticket.helpful_feedback ? '✓ Marked Helpful' : '✗ Marked Not Helpful'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function AnalysisItem({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-lg px-3 py-2.5">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <div>{value}</div>
    </div>
  )
}
