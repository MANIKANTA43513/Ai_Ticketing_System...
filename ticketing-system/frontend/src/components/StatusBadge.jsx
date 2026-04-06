import clsx from 'clsx'

const STATUS_STYLES = {
  'New':          'bg-slate-100 text-slate-700',
  'Assigned':     'bg-blue-100 text-blue-700',
  'In Progress':  'bg-yellow-100 text-yellow-700',
  'Pending Info': 'bg-orange-100 text-orange-700',
  'Resolved':     'bg-green-100 text-green-700',
  'Closed':       'bg-slate-200 text-slate-500',
}

const SEV_STYLES = {
  'Critical': 'bg-red-100 text-red-700 border border-red-200',
  'High':     'bg-orange-100 text-orange-700 border border-orange-200',
  'Medium':   'bg-yellow-100 text-yellow-700 border border-yellow-200',
  'Low':      'bg-green-100 text-green-700 border border-green-200',
}

const SENTIMENT_STYLES = {
  'Frustrated': 'bg-red-50 text-red-600',
  'Neutral':    'bg-slate-100 text-slate-600',
  'Polite':     'bg-green-50 text-green-600',
}

export function StatusBadge({ status }) {
  return (
    <span className={clsx('badge', STATUS_STYLES[status] || 'bg-slate-100 text-slate-600')}>
      {status}
    </span>
  )
}

export function SeverityBadge({ severity }) {
  return (
    <span className={clsx('badge', SEV_STYLES[severity] || 'bg-slate-100 text-slate-600')}>
      {severity}
    </span>
  )
}

export function SentimentBadge({ sentiment }) {
  return (
    <span className={clsx('badge', SENTIMENT_STYLES[sentiment] || 'bg-slate-100 text-slate-600')}>
      {sentiment}
    </span>
  )
}

export function CategoryBadge({ category }) {
  return (
    <span className="badge bg-brand-100 text-brand-700">
      {category}
    </span>
  )
}
