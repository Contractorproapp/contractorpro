import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind class names with conflict resolution.
 * Used by shadcn/ui components and anywhere we conditionally compose classes.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
