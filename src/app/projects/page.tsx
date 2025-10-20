"use client";

import Link from "next/link";
import { Component } from "@/components/ui/infinite-menu";
import { useState, useEffect } from "react";
import { projects } from "@/config/projects";

export default function Projects() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Start with content hidden, then fade in after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50); // Reduced delay for faster loading

    return () => clearTimeout(timer);
  }, []);

  // Projects are now configured in src/config/projects.ts for easy customization
  const items = projects;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header with back button */}
      <header 
        className="p-8 transition-opacity duration-1000"
        style={{ opacity: isVisible ? 1 : 0 }}
      >
        <Link
          href="/"
          className="inline-flex items-center text-white/70 hover:text-white transition-colors duration-300"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </Link>
      </header>

      {/* Main content */}
      <main 
        className="flex-1 px-8 transition-opacity duration-1000"
        style={{ opacity: isVisible ? 1 : 0 }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-light mb-4">
              Proyectos
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Una selección de nuestros proyectos más destacados. Cada uno representa nuestro compromiso con la innovación y la excelencia.
            </p>
          </div>
          
          {/* Infinite Menu Component */}
          <div className="flex w-full justify-center items-center">
            <div style={{ height: "600px", width: "100%", maxWidth: "800px", position: "relative" }}>
              <Component items={items} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer 
        className="p-8 text-center transition-opacity duration-1000"
        style={{ opacity: isVisible ? 1 : 0 }}
      >
        <a
          href="https://blessedux.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/60 hover:text-white transition-colors duration-300 text-sm"
        >
          built with ❤️ by blessedux
        </a>
      </footer>
    </div>
  );
}
