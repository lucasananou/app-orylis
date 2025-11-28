import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type UserRole = "prospect" | "client" | "staff";

export function isStaff(role: UserRole | undefined | null): role is "staff" {
  return role === "staff";
}

export function isProspect(role: UserRole | undefined | null): role is "prospect" {
  return role === "prospect";
}

export function isClient(role: UserRole | undefined | null): role is "client" {
  return role === "client";
}

export function canAccessTickets(role: UserRole | undefined | null): boolean {
  return role === "client" || role === "staff";
}

export function canAccessFiles(role: UserRole | undefined | null): boolean {
  return role === "client" || role === "staff";
}

export function canAccessBilling(role: UserRole | undefined | null): boolean {
  return role === "client" || role === "staff";
}

export function canRequestModifications(role: UserRole | undefined | null): boolean {
  return role === "client" || role === "staff";
}

export function canGiveFeedback(role: UserRole | undefined | null): boolean {
  return role === "client" || role === "staff";
}

export function userCanAccessProject(params: {
  role: UserRole;
  userId: string;
  ownerId: string;
}) {
  const { role, userId, ownerId } = params;
  return isStaff(role) || ownerId === userId;
}

export function assertUserCanAccessProject(params: {
  role: UserRole;
  userId: string;
  ownerId: string;
}) {
  if (!userCanAccessProject(params)) {
    const error = new Error("FORBIDDEN_PROJECT_ACCESS");
    error.name = "ForbiddenError";
    throw error;
  }
}

export function formatDate(
  value: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }
) {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", options).format(date);
}

export function formatProgress(progress: number | null | undefined) {
  if (typeof progress !== "number" || Number.isNaN(progress)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(progress)));
}

const SAFE_FILENAME_REGEX = /[^a-z0-9.-]+/gi;

export function buildFileStoragePath(projectId: string, fileId: string, filename: string) {
  const extensionMatch = /\.[a-zA-Z0-9]{1,8}$/.exec(filename);
  const extension = extensionMatch ? extensionMatch[0].toLowerCase() : "";
  const baseName = filename.replace(extension, "").toLowerCase().replace(SAFE_FILENAME_REGEX, "-");
  const normalizedBase = baseName.slice(0, 80) || "fichier";
  return `projects/${projectId}/${fileId}/${normalizedBase}${extension}`;
}

export function getFileKindIcon(input: string) {
  const value = input.toLowerCase();
  if (value.includes("pdf") || value.endsWith(".pdf")) return "pdf";
  if (value.includes("image") || value.endsWith(".png") || value.endsWith(".jpg") || value.endsWith(".jpeg"))
    return "image";
  if (value.includes("zip") || value.endsWith(".zip")) return "archive";
  return "doc";
}

export function assertStaff(role: UserRole | undefined | null) {
  if (!isStaff(role)) {
    const error = new Error("FORBIDDEN_STAFF_ONLY");
    error.name = "ForbiddenError";
    throw error;
  }
}

export async function safeAction<T>(action: () => Promise<T>) {
  try {
    const data = await action();
    return { data, error: null as null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

export function safeJson<T>(data: T, init?: number | ResponseInit) {
  const responseInit: ResponseInit =
    typeof init === "number" ? { status: init } : init ?? {};
  const headers = new Headers(responseInit.headers);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return new Response(JSON.stringify(data), {
    ...responseInit,
    headers
  });
}

export function parseISODate(value: string | undefined) {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const error = new Error("INVALID_DATE");
    error.name = "ValidationError";
    throw error;
  }
  return date;
}
