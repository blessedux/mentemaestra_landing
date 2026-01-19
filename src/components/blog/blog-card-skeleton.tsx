export default function BlogCardSkeleton() {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl bg-gray-900 border-2 border-gray-800 animate-pulse">
      {/* Top Section - Image Placeholder (70-75% of card) */}
      <div className="relative aspect-[4/3] w-full overflow-hidden flex-shrink-0 bg-gray-800 rounded-t-2xl">
        {/* Empty dark gray area for image */}
      </div>

      {/* Bottom Fold Section */}
      <div className="flex flex-col p-4 bg-gray-800/50 flex-grow relative rounded-b-2xl overflow-hidden">
        {/* Bottom Fold Decoration - Paper fold effect */}
        <div 
          className="absolute bottom-0 right-0 w-24 h-24 opacity-20"
          style={{
            background: 'linear-gradient(135deg, transparent 0%, transparent 50%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.3) 100%)',
            clipPath: 'polygon(100% 0%, 100% 100%, 0% 100%)',
          }}
        ></div>
        <div 
          className="absolute bottom-0 right-0 w-16 h-16 opacity-30"
          style={{
            background: 'linear-gradient(135deg, transparent 0%, transparent 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2) 100%)',
            clipPath: 'polygon(100% 0%, 100% 100%, 0% 100%)',
          }}
        ></div>
        
        {/* Content in Bottom Fold - Icon and Text Lines */}
        <div className="flex items-center gap-3 relative z-10">
          {/* Small square icon/avatar placeholder */}
          <div className="w-4 h-4 bg-gray-600 rounded flex-shrink-0"></div>
          
          {/* Text lines placeholder */}
          <div className="flex-1 space-y-2">
            {/* Longer line (title) */}
            <div className="h-3 bg-gray-600 rounded w-full"></div>
            {/* Shorter line (metadata) */}
            <div className="h-2.5 bg-gray-600 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
