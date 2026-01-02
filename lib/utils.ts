import crypto from "crypto";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import removeAccents from "remove-accents";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSafeDocumentId(name: string): string {
  return name.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function normalizeString(str?: string | null) {
  if (!str) return "";
  return removeAccents(str.toLowerCase());
}

export function exactKey(value?: string | null) {
  return crypto.createHash("sha1").update(normalizeString(value)).digest("hex");
}

export function getQueryIndexedKey(
  redisIndexedKey: string,
  querySignature: string
): string {
  return `${redisIndexedKey}:${Buffer.from(querySignature).toString("base64")}`;
}
