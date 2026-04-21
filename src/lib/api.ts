import type {
  ArchivedFile,
  FileKind,
  ImpactStats,
  Role,
  ShareLink,
  SharePermission,
  User,
} from "./types";
import {
  mockFiles,
  mockImpact,
  mockShareLinks,
  mockUsers,
} from "./mockData";

const LATENCY_MIN = 200;
const LATENCY_MAX = 400;

function sleep(): Promise<void> {
  const ms = LATENCY_MIN + Math.random() * (LATENCY_MAX - LATENCY_MIN);
  return new Promise((r) => setTimeout(r, ms));
}

function apiError(code: string, message: string): { code: string; message: string } {
  return { code, message };
}

// --- In-memory state (resettable for tests) ---
let files: ArchivedFile[] = [...mockFiles];
let shareLinks: ShareLink[] = [...mockShareLinks];
let currentUser: User | null = null;

export function __resetApiStateForTests(): void {
  files = [...mockFiles];
  shareLinks = [...mockShareLinks];
  currentUser = null;
}

// --- Auth ---
export async function mockSignIn(role: Role): Promise<User> {
  await sleep();
  const user =
    role === "student"
      ? mockUsers.student_maria
      : role === "faculty"
        ? mockUsers.faculty_cruz
        : mockUsers.admin_reyes;
  currentUser = user;
  return user;
}

export async function signOut(): Promise<void> {
  await sleep();
  currentUser = null;
}

export async function getCurrentUser(): Promise<User | null> {
  await sleep();
  return currentUser;
}

// --- Files ---
export interface ListFilesParams {
  query?: string;
  kind?: FileKind;
  tag?: string;
  ownerId?: string;
  sort?: "recent" | "largest" | "most_saved";
}

export async function listFiles(params: ListFilesParams = {}): Promise<ArchivedFile[]> {
  await sleep();
  let result = [...files];
  if (params.kind) result = result.filter((f) => f.kind === params.kind);
  if (params.ownerId) result = result.filter((f) => f.ownerId === params.ownerId);
  if (params.tag) {
    const t = params.tag.toLowerCase();
    result = result.filter((f) => f.tags.some((tag) => tag.toLowerCase() === t));
  }
  if (params.query) {
    const q = params.query.toLowerCase();
    result = result.filter(
      (f) => f.name.toLowerCase().includes(q) || f.tags.some((t) => t.toLowerCase().includes(q))
    );
  }
  const sort = params.sort ?? "recent";
  if (sort === "recent") {
    result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } else if (sort === "largest") {
    result.sort((a, b) => b.originalBytes - a.originalBytes);
  } else if (sort === "most_saved") {
    result.sort(
      (a, b) => b.originalBytes - b.storedBytes - (a.originalBytes - a.storedBytes)
    );
  }
  return result;
}

export async function getFile(id: string): Promise<ArchivedFile> {
  await sleep();
  const file = files.find((f) => f.id === id);
  if (!file) throw apiError("not_found", `File ${id} not found`);
  return file;
}

function detectKind(file: File): { kind: FileKind; mime: string } {
  const mime = file.type || "application/octet-stream";
  if (mime === "application/pdf") return { kind: "pdf", mime };
  if (mime.startsWith("image/")) return { kind: "image", mime };
  if (mime.startsWith("video/")) return { kind: "video", mime };
  if (file.name.endsWith(".docx")) return { kind: "docx", mime };
  if (file.name.endsWith(".pptx")) return { kind: "pptx", mime };
  return { kind: "other", mime };
}

export async function uploadFile(file: File): Promise<ArchivedFile> {
  await sleep();
  const { kind, mime } = detectKind(file);
  const originalBytes = file.size;
  const storedBytes = Math.round(originalBytes * (0.15 + Math.random() * 0.15));
  const url = URL.createObjectURL(file);
  const now = new Date().toISOString();
  const uploader = currentUser?.id ?? "admin_reyes";
  const archived: ArchivedFile = {
    id: `upload_${Date.now()}`,
    name: file.name,
    kind,
    mimeType: mime,
    ownerId: uploader,
    originalBytes,
    storedBytes,
    compressionRatio: (originalBytes - storedBytes) / originalBytes,
    tags: ["Uploaded"],
    createdAt: now,
    updatedAt: now,
    previewUrl: url,
    downloadUrl: url,
  };
  files = [archived, ...files];
  return archived;
}

export async function deleteFile(id: string): Promise<void> {
  await sleep();
  const before = files.length;
  files = files.filter((f) => f.id !== id);
  if (files.length === before) throw apiError("not_found", `File ${id} not found`);
}

// --- Sharing ---
export async function createShareLink(
  fileId: string,
  permission: SharePermission
): Promise<ShareLink> {
  await sleep();
  const file = files.find((f) => f.id === fileId);
  if (!file) throw apiError("not_found", `File ${fileId} not found`);
  const link: ShareLink = {
    id: `share_${Math.random().toString(36).slice(2, 10)}`,
    fileId,
    createdBy: currentUser?.id ?? file.ownerId,
    createdAt: new Date().toISOString(),
    permission,
  };
  shareLinks = [link, ...shareLinks];
  return link;
}

export async function getShareLink(
  shareId: string
): Promise<{ link: ShareLink; file: ArchivedFile }> {
  await sleep();
  const link = shareLinks.find((l) => l.id === shareId);
  if (!link) throw apiError("not_found", `Share ${shareId} not found`);
  const file = files.find((f) => f.id === link.fileId);
  if (!file) throw apiError("not_found", `File ${link.fileId} missing`);
  return { link, file };
}

export async function revokeShareLink(shareId: string): Promise<void> {
  await sleep();
  const before = shareLinks.length;
  shareLinks = shareLinks.filter((l) => l.id !== shareId);
  if (shareLinks.length === before) throw apiError("not_found", `Share ${shareId} not found`);
}

// --- Impact ---
export async function getImpactStats(): Promise<ImpactStats> {
  await sleep();
  return mockImpact;
}
