import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatScore(score: number): string {
  return Math.round(score).toString()
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600"
  if (score >= 60) return "text-blue-600"
  if (score >= 40) return "text-yellow-600"
  return "text-red-600"
}

export function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-green-100"
  if (score >= 60) return "bg-blue-100"
  if (score >= 40) return "bg-yellow-100"
  return "bg-red-100"
}

export function getMatchLevelColor(level: string): string {
  switch (level) {
    case "excellent":
      return "text-green-600 bg-green-100"
    case "strong":
      return "text-blue-600 bg-blue-100"
    case "good":
      return "text-yellow-600 bg-yellow-100"
    case "fair":
      return "text-orange-600 bg-orange-100"
    case "poor":
      return "text-red-600 bg-red-100"
    default:
      return "text-gray-600 bg-gray-100"
  }
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "high":
      return "text-red-600 bg-red-100 border-red-200"
    case "medium":
      return "text-yellow-600 bg-yellow-100 border-yellow-200"
    case "low":
      return "text-blue-600 bg-blue-100 border-blue-200"
    default:
      return "text-gray-600 bg-gray-100 border-gray-200"
  }
}
