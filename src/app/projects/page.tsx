"use client";

import Link from "next/link";
import { Component } from "@/components/ui/infinite-menu";
import { MenuItem } from "@/components/ui/infinite-menu/types";
import { useState, useEffect } from "react";

export default function Projects() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Start with content hidden, then fade in after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50); // Reduced delay for faster loading

    return () => clearTimeout(timer);
  }, []);

  // Projects are now automatically loaded from the infinite-menu module
  // The Component will use the 27 projects defined in projects-data.ts
  const items: MenuItem[] = []; // Empty array - Component will use default projects data

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header with back button */}
      <header 
        className="p-8 transition-opacity duration-1000"
        style={{ opacity: isVisible ? 1 : 0 }}
      >
        <Link
          href="/"
          className="inline-flex items-center text-white/70 hover:text-white transition-colors duration-300 mt-4 ml-4 md:mt-6 md:ml-6"
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
              {/* Infinite Menu Component */}
              <div className="flex w-full justify-center items-center">
                <div className="w-full max-w-4xl relative" style={{ height: "600px", minHeight: "600px" }}>
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
