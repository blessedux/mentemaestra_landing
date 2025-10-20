"use client";

import { useState, useEffect } from "react";
import Preloader from "./Preloader";

interface ClientWrapperProps {
  children: React.ReactNode;
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("ClientWrapper mounted, isLoading:", isLoading);
    
    // Extended time to allow Spline iframe to load during preloader
    const timer = setTimeout(() => {
      console.log("Preloader complete - showing Spline scene");
      setIsLoading(false);
    }, 8000); // Extended to 8 seconds to allow Spline to load during preloader

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {isLoading && <Preloader />}
      <div className={isLoading ? "opacity-0" : "opacity-100 transition-opacity duration-1000"}>
        {children}
      </div>
    </>
  );
}
