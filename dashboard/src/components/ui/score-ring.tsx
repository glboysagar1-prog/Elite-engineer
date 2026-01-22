// import * as React from "react"
import { cn } from "@/lib/utils"

interface ScoreRingProps {
    score: number
    size?: "sm" | "md" | "lg" | "xl"
    strokeWidth?: number
    showLabel?: boolean
    label?: string
    className?: string
    animate?: boolean
}

const sizeMap = {
    sm: 60,
    md: 100,
    lg: 140,
    xl: 180,
}

const fontSizeMap = {
    sm: "text-lg",
    md: "text-3xl",
    lg: "text-4xl",
    xl: "text-5xl",
}

function getScoreColor(score: number): string {
    if (score >= 80) return "#22c55e" // green-500
    if (score >= 60) return "#3b82f6" // blue-500
    if (score >= 40) return "#eab308" // yellow-500
    return "#ef4444" // red-500
}

function getScoreGlow(score: number): string {
    if (score >= 80) return "drop-shadow(0 0 8px rgba(34, 197, 94, 0.4))"
    if (score >= 60) return "drop-shadow(0 0 8px rgba(59, 130, 246, 0.4))"
    if (score >= 40) return "drop-shadow(0 0 8px rgba(234, 179, 8, 0.4))"
    return "drop-shadow(0 0 8px rgba(239, 68, 68, 0.4))"
}

export function ScoreRing({
    score,
    size = "lg",
    strokeWidth = 8,
    showLabel = true,
    label = "Score",
    className,
    animate = true,
}: ScoreRingProps) {
    const dimension = sizeMap[size]
    const radius = (dimension - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (score / 100) * circumference
    const color = getScoreColor(score)
    const glow = getScoreGlow(score)

    return (
        <div className={cn("relative inline-flex items-center justify-center", className)}>
            <svg
                width={dimension}
                height={dimension}
                className="transform -rotate-90"
                style={{ filter: glow }}
            >
                {/* Background circle */}
                <circle
                    cx={dimension / 2}
                    cy={dimension / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-muted/20"
                />
                {/* Progress circle */}
                <circle
                    cx={dimension / 2}
                    cy={dimension / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={animate ? circumference : offset}
                    className={cn(
                        "transition-all duration-1000 ease-out",
                        animate && "ring-animate"
                    )}
                    style={{
                        strokeDashoffset: offset,
                        transitionDelay: "200ms",
                    }}
                />
            </svg>
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn("font-bold tabular-nums", fontSizeMap[size])}>
                    {Math.round(score)}
                </span>
                {showLabel && (
                    <span className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">
                        {label}
                    </span>
                )}
            </div>
        </div>
    )
}
