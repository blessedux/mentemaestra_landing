import { type SanityDocument } from 'next-sanity'
import Link from 'next/link'
import Category from './category'
import Search from '../ui/search'

interface SidebarProps {
  categories?: SanityDocument[]
  recentPosts?: SanityDocument[]
  featuredPosts?: SanityDocument[]
  className?: string
}

export default function Sidebar({
  categories = [],
  recentPosts = [],
  featuredPosts = [],
  className = ''
}: SidebarProps) {
  return (
    <aside className={`space-y-8 ${className}`}>
      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Search
        </h3>
        <Search />
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Categories
          </h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Category
                key={category._id}
                category={category}
                variant="badge"
                size="sm"
              />
            ))}
          </div>
          <div className="mt-4">
            <Link
              href="/blog/categories"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              View all categories →
            </Link>
          </div>
        </div>
      )}

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Featured Posts
          </h3>
          <div className="space-y-4">
            {featuredPosts.slice(0, 3).map((post) => (
              <div key={post._id} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0 pb-4 last:pb-0">
                <Link
                  href={`/blog/${post.slug.current}`}
                  className="block group"
                >
                  <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-sm leading-tight mb-1">
                    {post.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(post.publishedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Posts */}
      {recentPosts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Posts
          </h3>
          <div className="space-y-4">
            {recentPosts.slice(0, 5).map((post) => (
              <div key={post._id} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0 pb-4 last:pb-0">
                <Link
                  href={`/blog/${post.slug.current}`}
                  className="block group"
                >
                  <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-sm leading-tight mb-1">
                    {post.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(post.publishedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Newsletter Signup (Optional) */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-100 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Stay Updated
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Get the latest posts delivered to your inbox.
        </p>
        <form className="space-y-3">
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors duration-200"
          >
            Subscribe
          </button>
        </form>
      </div>
    </aside>
  )
}
