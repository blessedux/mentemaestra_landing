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
    
    // Shorter duration to minimize gap between preloader and home screen
    const timer = setTimeout(() => {
      console.log("Preloader complete - showing Spline scene");
      setIsLoading(false);
    }, 2500); // Reduced to 2.5 seconds for faster transition

    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <>
      {isLoading && <Preloader />}
      <div className={isLoading ? "opacity-0" : "opacity-100 transition-opacity duration-500"}>
        {children}
      </div>
    </>
  );
}
