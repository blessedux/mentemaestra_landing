"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Dynamically import SplineScene with no SSR
const SplineScene = dynamic(() => import("@/components/SplineScene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-black flex items-center justify-center">
      <div className="text-white text-lg">Cargando escena 3D...</div>
    </div>
  ),
});

export default function Home() {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(0);

  const handleSplineLoaded = () => {
    console.log("🎉 Home: Spline scene loaded successfully");
  };

  const handleSplineError = () => {
    console.error("❌ Home: Spline scene failed to load");
  };

  const handleCTAClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    
    // Fast fade out everything including the button
    const fadeInterval = setInterval(() => {
      setOverlayOpacity(prev => {
        if (prev >= 1) {
          clearInterval(fadeInterval);
          return 1;
        }
        return prev + 0.1; // Faster fade
      });
    }, 20);

    // Navigate immediately after short fade
    setTimeout(() => {
      router.push('/projects');
    }, 500); // Much faster navigation
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Spline Scene */}
      <SplineScene 
        onLoaded={handleSplineLoaded}
        onError={handleSplineError}
      />

      {/* Black overlay */}
      <div 
        className="absolute inset-0 bg-black pointer-events-none"
        style={{
          opacity: overlayOpacity,
          transition: 'opacity 0.1s ease-out'
        }}
      />
      
       {/* Bottom centered CTA button with margin and proper interaction */}
       <div 
         className="absolute bottom-[30%] left-1/2 transform -translate-x-1/2 z-10"
         style={{
           opacity: 1 - overlayOpacity,
           transition: 'opacity 0.1s ease-out'
         }}
       >
         <button
           onClick={handleCTAClick}
           disabled={isTransitioning}
           className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white font-medium text-lg hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
           style={{ 
             pointerEvents: 'auto',
             zIndex: 1000
           }}
           onMouseDown={(e) => e.stopPropagation()}
           onTouchStart={(e) => e.stopPropagation()}
         >
           Ver Proyectos
         </button>
       </div>

      {/* Social icons - Mobile only */}
      <div 
        className="absolute bottom-[18%] left-1/2 transform -translate-x-1/2 z-10 md:hidden mb-4"
        style={{
          opacity: 1 - overlayOpacity,
          transition: 'opacity 0.1s ease-out'
        }}
      >
        <div className="flex items-center justify-center space-x-8">
          {/* WhatsApp */}
          <a
            href="https://wa.me/+56994621925"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors duration-300"
            style={{ 
              pointerEvents: 'auto',
              zIndex: 1000
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
            </svg>
          </a>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/mentemaestra.space/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors duration-300"
            style={{ 
              pointerEvents: 'auto',
              zIndex: 1000
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>

          {/* Telegram */}
          <a
            href="https://t.me/blessedux"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors duration-300"
            style={{ 
              pointerEvents: 'auto',
              zIndex: 1000
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
