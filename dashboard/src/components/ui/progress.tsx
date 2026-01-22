import * as React from "react"
import { cn } from "@/lib/utils"

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  showValue?: boolean
  size?: "sm" | "default" | "lg"
  variant?: "default" | "gradient" | "success" | "warning" | "info"
  animate?: boolean
}

const sizeStyles = {
  sm: "h-1.5",
  default: "h-2",
  lg: "h-3",
}

const variantStyles = {
  default: "bg-primary",
  gradient: "bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500",
  success: "bg-gradient-to-r from-green-500 to-emerald-500",
  warning: "bg-gradient-to-r from-yellow-500 to-orange-500",
  info: "bg-gradient-to-r from-blue-500 to-cyan-500",
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({
    className,
    value,
    max = 100,
    showValue = false,
    size = "default",
    variant = "default",
    animate = true,
    ...props
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    return (
      <div className="relative">
        <div
          ref={ref}
          className={cn(
            "relative w-full overflow-hidden rounded-full bg-secondary/50",
            sizeStyles[size],
            className
          )}
          {...props}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700 ease-out",
              variantStyles[variant],
              animate && "animate-progress"
            )}
            style={{
              width: `${percentage}%`,
              boxShadow: percentage > 70 ? '0 0 8px rgba(59, 130, 246, 0.4)' : undefined
            }}
          />
        </div>
        {showValue && (
          <span className="absolute right-0 -top-5 text-xs font-medium text-muted-foreground">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }
