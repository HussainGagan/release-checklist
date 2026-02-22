import type { Release } from "./types";

export function formatDate(dateIso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateIso));
}

export function toDateInputValue(iso: string): string {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDefaultDueDateLocal(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(0, 0, 0, 0);
  return toDateInputValue(date.toISOString());
}

export function sortReleases(items: Release[]): Release[] {
  return [...items].sort((left, right) => {
    const dateDelta =
      new Date(right.dueDate).getTime() - new Date(left.dueDate).getTime();
    if (dateDelta !== 0) {
      return dateDelta;
    }
    return Number(right.id) - Number(left.id);
  });
}

export function upsertRelease(items: Release[], release: Release): Release[] {
  const next = items.filter((item) => item.id !== release.id);
  next.push(release);
  return sortReleases(next);
}
