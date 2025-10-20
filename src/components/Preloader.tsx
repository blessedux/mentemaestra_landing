"use client";

import { useState, useEffect } from "react";

export default function Preloader() {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    console.log("Preloader mounted");
    
    const timer = setInterval(() => {
      setProgress((prev) => {
        const increment = Math.random() * 8 + 3; // 3-11% increment (slower progression)
        const newProgress = Math.min(prev + increment, 100);
        
        if (newProgress >= 100) {
          clearInterval(timer);
          console.log("Preloader complete, starting fade out");
          setTimeout(() => {
            setIsVisible(false);
            console.log("Preloader fade out complete");
          }, 300);
          return 100;
        }
        return newProgress;
      });
    }, 200); // Slower interval for smoother 4-second duration

    return () => {
      console.log("Preloader cleanup");
      clearInterval(timer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="text-center">
        {/* Logo or brand name */}
        <div className="mb-8">
          <h1 className="text-4xl font-light text-white tracking-wider">
            MENTE MAESTRA
          </h1>
        </div>
        
        {/* Progress bar */}
        <div className="w-80 h-1 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        
        {/* Progress percentage */}
        <div className="mt-6 text-white/70 text-lg font-light">
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  );
}
