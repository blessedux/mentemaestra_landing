import Link from 'next/link'

interface CategoryProps {
  category?: {
    _id: string
    title: string
    slug: { current: string }
    description?: string
    color?: string
  }
  categories?: Array<{
    _id: string
    title: string
    slug: { current: string }
    description?: string
    color?: string
  }>
  showDescription?: boolean
  variant?: 'badge' | 'card' | 'link'
  size?: 'sm' | 'md' | 'lg'
  nomargin?: boolean
}

export default function Category({
  category,
  categories,
  showDescription = false,
  variant = 'badge',
  size = 'md',
  nomargin = false
}: CategoryProps) {
  const baseStyles = "inline-block font-medium transition-colors duration-200"

  const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  const variantStyles = {
    badge: `rounded-full ${
      category?.color
        ? `hover:opacity-80`
        : 'bg-blue-900 text-blue-200 hover:bg-blue-800'
    }`,
    card: 'bg-gray-800 rounded-lg shadow-sm hover:shadow-md p-4 border border-gray-700 hover:border-blue-600',
    link: 'text-gray-400 hover:text-blue-400'
  }

  // If categories array is provided, render all categories
  if (categories && categories.length > 0) {
    return (
      <div className={`flex flex-wrap gap-2 ${nomargin ? '' : 'mb-3'}`}>
        {categories.slice(0, 2).map((cat) => {
          const style = cat.color && variant === 'badge' ? {
            backgroundColor: `${cat.color}20`,
            color: cat.color,
            border: `1px solid ${cat.color}40`
          } : {}

          return (
            <Link key={cat._id} href={`/blog/categories/${cat.slug.current}`}>
              <span
                className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]}`}
                style={style}
              >
                {cat.title}
              </span>
            </Link>
          )
        })}
      </div>
    )
  }

  // Single category rendering
  if (!category) return null;

  const style = category.color && variant === 'badge' ? {
    backgroundColor: `${category.color}20`,
    color: category.color,
    border: `1px solid ${category.color}40`
  } : {}

  if (variant === 'card') {
    return (
      <Link href={`/blog/categories/${category.slug.current}`}>
        <div
          className={`${baseStyles} ${variantStyles.card}`}
          style={style}
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            {category.title}
          </h3>
          {showDescription && category.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {category.description}
            </p>
          )}
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/blog/categories/${category.slug.current}`}>
      <span
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]}`}
        style={style}
      >
        {category.title}
      </span>
    </Link>
  )
}
