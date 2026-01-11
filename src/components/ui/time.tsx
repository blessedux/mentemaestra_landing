import { format, formatDistanceToNow } from 'date-fns'

interface TimeProps {
  date: string | Date
  format?: 'short' | 'medium' | 'long' | 'relative'
  className?: string
}

export default function Time({
  date,
  format: formatType = 'medium',
  className = 'text-gray-500 dark:text-gray-400'
}: TimeProps) {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  const getFormattedDate = () => {
    switch (formatType) {
      case 'short':
        return format(dateObj, 'MMM d, yyyy')
      case 'medium':
        return format(dateObj, 'MMM d, yyyy')
      case 'long':
        return format(dateObj, 'MMMM d, yyyy')
      case 'relative':
        return formatDistanceToNow(dateObj, { addSuffix: true })
      default:
        return format(dateObj, 'MMM d, yyyy')
    }
  }

  return (
    <time
      dateTime={dateObj.toISOString()}
      className={`text-sm ${className}`}
      title={format(dateObj, 'PPP p')}
    >
      {getFormattedDate()}
    </time>
  )
}
