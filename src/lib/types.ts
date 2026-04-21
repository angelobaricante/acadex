export type Role = "student" | "faculty" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
}

export type FileKind = "pdf" | "docx" | "pptx" | "image" | "video" | "other";

export interface ArchivedFile {
  id: string;
  name: string;
  kind: FileKind;
  mimeType: string;
  ownerId: string;
  originalBytes: number;
  storedBytes: number;
  compressionRatio: number; // 0..1 (0.82 = 82% saved)
  tags: string[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
  previewUrl: string;
  downloadUrl: string;
  folderId?: string | null;
}

export type FolderColor = "green" | "amber" | "blue" | "violet" | "neutral";

export interface Folder {
  id: string;
  name: string;
  ownerId: string;
  color: FolderColor;
  createdAt: string; // ISO
}

export type SharePermission = "view" | "view_and_download";

export interface ShareLink {
  id: string;
  fileId: string;
  createdBy: string;
  createdAt: string;
  permission: SharePermission;
  expiresAt?: string;
}

export interface ImpactStats {
  totalOriginalBytes: number;
  totalStoredBytes: number;
  bytesSaved: number;
  co2KgAvoided: number;
  pesosSaved: number;
  fileCount: number;
  byKind: Record<FileKind, { count: number; bytesSaved: number }>;
  trend: Array<{ date: string; bytesSaved: number }>;
}

export interface ApiError {
  code: string;
  message: string;
}
