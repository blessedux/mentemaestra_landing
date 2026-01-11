interface LabelProps {
  htmlFor?: string
  children: React.ReactNode
  required?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'muted'
}

export default function Label({
  htmlFor,
  children,
  required = false,
  className = '',
  size = 'md',
  variant = 'default'
}: LabelProps) {
  const baseStyles = 'font-medium transition-colors duration-200'

  const sizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  const variantStyles = {
    default: 'text-gray-900 dark:text-white',
    muted: 'text-gray-600 dark:text-gray-400'
  }

  return (
    <label
      htmlFor={htmlFor}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  )
}
