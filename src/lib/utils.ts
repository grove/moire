import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortIRI(iri: string): string {
  return iri.split(/[#/]/).at(-1) ?? iri;
}

export function pluralise(word: string): string {
  if (!word) return word;
  if (word.endsWith("s")) return word;
  if (word.endsWith("y")) return word.slice(0, -1) + "ies";
  return word + "s";
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}
