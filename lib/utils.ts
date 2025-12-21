import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSearchTerms(name: string) {
  const lower = name.toLowerCase().trim();
  const terms: string[] = [];
  const words = lower.split(/\s+/);
  for (const word of words) {
    let prefix = "";
    for (const char of word) {
      prefix += char;
      terms.push(prefix);
    }
  }
  return Array.from(new Set(terms));
}
