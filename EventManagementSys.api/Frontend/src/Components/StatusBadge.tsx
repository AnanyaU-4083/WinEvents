interface StatusBadgeProps {
  status: string
  context?: 'event' | 'task'
}

function StatusBadge({ status, context = 'event' }: StatusBadgeProps) {
  const normalizedStatus = status.trim().toLowerCase()
  let colorClass = 'border-gray-200 bg-gray-50 text-gray-700'

  if (context === 'event') {
    if (normalizedStatus === 'scheduled') {
      colorClass = 'border-blue-200 bg-blue-50 text-blue-700'
    } else if (normalizedStatus === 'cancelled' || normalizedStatus === 'canceled') {
      colorClass = 'border-red-200 bg-red-50 text-red-700'
    }
  } else if (normalizedStatus === 'completed') {
    colorClass = 'border-green-200 bg-green-50 text-green-700'
  } else if (normalizedStatus === 'inprogress' || normalizedStatus === 'in progress') {
    colorClass = 'border-blue-200 bg-blue-50 text-blue-700'
  } else if (normalizedStatus === 'pending') {
    colorClass = 'border-yellow-200 bg-yellow-50 text-yellow-700'
  } else if (normalizedStatus === 'overdue') {
    colorClass = 'border-red-200 bg-red-50 text-red-700'
  }

  return (
    <span className={`inline-flex rounded-lg border px-3 py-1 text-xs font-medium ${colorClass}`}>
      {status}
    </span>
  )
}

export default StatusBadge
