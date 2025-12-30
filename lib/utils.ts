import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import removeAccents from "remove-accents";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeString(str?: string | null) {
  if (!str) return "";
  return removeAccents(str.toLowerCase());
}

export function generateSafeDocumentId(name: string): string {
  return name.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
}
