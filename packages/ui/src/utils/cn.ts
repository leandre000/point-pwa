import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes with clsx. The standard pattern for conditional classes. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

