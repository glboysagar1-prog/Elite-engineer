import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
    min: number
    max: number
    step?: number
    value: number[]
    onValueChange: (value: number[]) => void
    className?: string
}

export function Slider({ min, max, step = 1, value, onValueChange, className }: SliderProps) {
    const [isDragging, setIsDragging] = React.useState(false)
    const trackRef = React.useRef<HTMLDivElement>(null)

    const percentage = ((value[0] - min) / (max - min)) * 100

    const handleInteract = (clientX: number) => {
        if (!trackRef.current) return
        const rect = trackRef.current.getBoundingClientRect()
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
        const p = x / rect.width
        const rawValue = min + p * (max - min)
        const steppedValue = Math.round(rawValue / step) * step
        const clampedValue = Math.max(min, Math.min(max, steppedValue))
        onValueChange([clampedValue])
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true)
        handleInteract(e.clientX)
    }

    React.useEffect(() => {
        if (!isDragging) return
        const handleMouseMove = (e: MouseEvent) => handleInteract(e.clientX)
        const handleMouseUp = () => setIsDragging(false)
        document.addEventListener("mousemove", handleMouseMove)
        document.addEventListener("mouseup", handleMouseUp)
        return () => {
            document.removeEventListener("mousemove", handleMouseMove)
            document.removeEventListener("mouseup", handleMouseUp)
        }
    }, [isDragging])

    return (
        <div
            ref={trackRef}
            className={cn("relative flex w-full touch-none select-none items-center py-4 cursor-pointer", className)}
            onMouseDown={handleMouseDown}
        >
            <div className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                    className="absolute h-full bg-slate-900 dark:bg-slate-50 transition-all duration-75 ease-out"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <div
                className={cn(
                    "block h-4 w-4 rounded-full border border-slate-900/50 bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-50/50 dark:bg-slate-950",
                    "shadow-sm hover:scale-110 transition-transform absolute -ml-2"
                )}
                style={{ left: `${percentage}%` }}
            />
        </div>
    )
}
