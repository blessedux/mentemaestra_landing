"use client"

import React, { useState, useRef } from "react"
import { motion, useMotionValue } from "framer-motion"

interface IconHover3DProps {
  heading?: string
  text?: string
  className?: string
  style?: React.CSSProperties
  width?: number
  height?: number
}

export function IconHover3D({
  heading = "The Process",
  text = "Your partner through every stage.",
  className = "",
  style = {},
  width = 600,
  height = 150,
}: IconHover3DProps) {
  const [isHovered, setIsHovered] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const rotateX = (e.clientY - centerY) / 20
    const rotateY = (centerX - e.clientX) / 20
    x.set(rotateY)
    y.set(rotateX)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    x.set(0)
    y.set(0)
  }

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width, height, ...style }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        ref={ref}
        className="relative flex flex-col items-center justify-center px-10 py-8"
        style={{
          rotateX: y,
          rotateY: x,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Heading with fill-on-hover effect */}
        <div className="relative overflow-hidden">
          <span
            className="relative z-10 block text-3xl font-bold tracking-tight text-white md:text-4xl"
            style={{
              clipPath: isHovered ? "inset(0 0 0 0)" : "inset(0 100% 0 0)",
              transition: "clip-path 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            }}
          >
            {heading}
          </span>
          <span
            className="absolute inset-0 block text-3xl font-bold tracking-tight text-white/90 md:text-4xl"
            aria-hidden
          >
            {heading}
          </span>
        </div>
        {/* Description */}
        <p className="mt-3 max-w-md text-center text-sm text-white/70 md:text-base">
          {text}
        </p>
      </motion.div>
    </div>
  )
}
