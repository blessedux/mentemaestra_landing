"use client";

import { useEffect, useState, useRef } from "react";

interface SplineSceneProps {
  onLoaded?: () => void;
  onError?: () => void;
}

export default function SplineScene({ onLoaded, onError }: SplineSceneProps) {
  const [hasError, setHasError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // No loading overlay needed - iframe loads during preloader
    onLoaded?.();
  }, [onLoaded]);

  const handleLoad = () => {
    onLoaded?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  if (hasError) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-light mb-4">MENTE MAESTRA</h1>
          <p className="text-white/60 mb-8">Escena 3D no disponible</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-white/10 border border-white/20 rounded-full hover:bg-white/20 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Spline iframe - Different scaling for mobile and desktop */}
      <iframe
        ref={iframeRef}
        src="https://my.spline.design/chrissheropage-GUcVzJypH4h2qTvmElCJgUsZ/"
        frameBorder="0"
        width="100%"
        height="100%"
        className="absolute inset-0 w-full h-full"
        allowFullScreen
        allow="fullscreen; xr-spatial-tracking; camera; microphone; gyroscope; accelerometer"
        style={{ 
          border: 'none',
          outline: 'none',
          background: 'transparent',
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '130%',
          height: '130%',
          transform: 'translate(-50%, -50%) scale(1.3)',
          transformOrigin: 'center center'
        }}
        loading="eager"
        onLoad={handleLoad}
        onError={handleError}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
      />
      
      {/* Mobile-specific scaling override */}
      <style jsx>{`
        @media (max-width: 768px) {
          iframe {
            transform: translate(-50%, -50%) scale(1.1) !important;
            width: 110% !important;
            height: 110% !important;
          }
        }
      `}</style>
    </div>
  );
}
