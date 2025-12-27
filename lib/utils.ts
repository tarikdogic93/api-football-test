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
