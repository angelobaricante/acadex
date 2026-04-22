import type {
  ArchivedFile,
  FileKind,
  Folder,
  FolderColor,
  ImpactStats,
  Role,
  ShareLink,
  SharePermission,
  User,
} from "./types";
import { driveDelete, driveList, driveUpload } from "./driveApi";
import { createDriveFolder, uploadFileToDrive } from "./drive/driveApi";
import { getAccessToken, signInWithGoogle, signOutFromGoogle } from "./googleAuth";
import { compressFile } from "./compression/compressFile";
import { createFileRecord } from "./supabase/fileService";
import { createFolderRecord } from "./supabase/folderService";
import { supabase } from "./supabaseClient";
import {
  mockFiles,
  mockFolders,
  mockImpact,
  mockShareLinks,
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

function isUuid(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

const uploadedByFallbackByScope = new Map<string, string>();

function getStableUploadedByFallback(scopeId?: string): string {
  const scope = scopeId && scopeId.length > 0 ? scopeId : "anonymous";
  const storageKey = `acadex_uploaded_by_uuid:${scope}`;

  const inMemory = uploadedByFallbackByScope.get(scope);
  if (inMemory && isUuid(inMemory)) return inMemory;

  try {
    const fromSession = sessionStorage.getItem(storageKey);
    if (fromSession && isUuid(fromSession)) {
      uploadedByFallbackByScope.set(scope, fromSession);
      return fromSession;
    }
  } catch {
    // Ignore storage access issues and fall back to in-memory UUID cache.
  }

  const generated = crypto.randomUUID();
  uploadedByFallbackByScope.set(scope, generated);

  try {
    sessionStorage.setItem(storageKey, generated);
  } catch {
    // Ignore storage access issues and keep in-memory UUID cache.
  }

  return generated;
}

// --- In-memory state (resettable for tests) ---
let files: ArchivedFile[] = mockFiles.map((f) => ({ ...f }));
let shareLinks: ShareLink[] = [...mockShareLinks];
let folders: Folder[] = [...mockFolders];
let currentUser: User | null = null;

export function __resetApiStateForTests(): void {
  files = mockFiles.map((f) => ({ ...f }));
  shareLinks = [...mockShareLinks];
  folders = [...mockFolders];
  currentUser = null;
}

// --- Auth ---
export async function mockSignIn(role: Role): Promise<User> {
  const profile = await signInWithGoogle();

  const user: User = {
    id: profile.sub,
    name: profile.name,
    email: profile.email,
    avatarUrl: profile.picture,
    role,
  };

  sessionStorage.setItem("acadex_user", JSON.stringify(user));
  currentUser = user;
  return user;
}

export async function signOut(): Promise<void> {
  signOutFromGoogle();
  sessionStorage.removeItem("acadex_user");
  currentUser = null;
}

export async function getCurrentUser(): Promise<User | null> {
  if (currentUser) return currentUser;
  const saved = sessionStorage.getItem("acadex_user");
  if (saved) {
    currentUser = JSON.parse(saved) as User;
    return currentUser;
  }
  return null;
}

// --- Files ---
export interface ListFilesParams {
  query?: string;
  kind?: FileKind;
  tag?: string;
  ownerId?: string;
  folderId?: string | null;
  sort?: "recent" | "largest" | "most_saved";
}

export interface FolderUploadSummary {
  succeeded: number;
  failed: number;
  totalOriginalBytes: number;
  totalStoredBytes: number;
}

export async function listFiles(params: ListFilesParams = {}): Promise<ArchivedFile[]> {
  let baseFiles: ArchivedFile[];
  let loadedFromDrive = false;
  try {
    getAccessToken();
    baseFiles = await driveList(params.query);
    loadedFromDrive = true;
  } catch {
    baseFiles = [...files];
  }

  if (loadedFromDrive) {
    const previousById = new Map(files.map((file) => [file.id, file]));
    baseFiles = baseFiles.map((driveFile) => {
      const previous = previousById.get(driveFile.id);
      if (!previous) return driveFile;

      return {
        ...driveFile,
        ownerId: previous.ownerId,
        originalBytes: previous.originalBytes,
        storedBytes: previous.storedBytes,
        compressionRatio: previous.compressionRatio,
        tags: previous.tags,
        folderId: previous.folderId,
      };
    });
  }

  let result = [...baseFiles];
  if (params.kind) result = result.filter((f) => f.kind === params.kind);
  if (params.ownerId) result = result.filter((f) => f.ownerId === params.ownerId);
  if (params.folderId === null) {
    result = result.filter((f) => f.folderId === null || f.folderId === undefined);
  } else if (typeof params.folderId === "string") {
    result = result.filter((f) => f.folderId === params.folderId);
  }
  if (params.tag) {
    const t = params.tag.toLowerCase();
    result = result.filter((f) => f.tags.some((tag) => tag.toLowerCase() === t));
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
  files = result.map((f) => ({ ...f }));
  return result;
}

export async function getFile(id: string): Promise<ArchivedFile> {
  await sleep();
  const file = files.find((f) => f.id === id);
  if (!file) throw apiError("not_found", `File ${id} not found`);
  return file;
}

export async function uploadFile(file: File, targetFolderId: string | null = null): Promise<ArchivedFile> {
  const compression = await compressFile(file);
  const archived = await driveUpload(compression.compressedFile);

  const compressionRatio =
    compression.originalSize > 0
      ? (compression.originalSize - compression.compressedSize) / compression.originalSize
      : 0;

  const archivedWithCompression: ArchivedFile = {
    ...archived,
    originalBytes: compression.originalSize,
    storedBytes: compression.compressedSize,
    compressionRatio,
    folderId: targetFolderId,
  };

  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();
  const uploadedBy = isUuid(supabaseUser?.id)
    ? supabaseUser!.id
    : isUuid(currentUser?.id)
      ? currentUser!.id
      : getStableUploadedByFallback(currentUser?.id);

  const folderIdForSupabase = isUuid(targetFolderId) ? targetFolderId : null;

  await createFileRecord({
    driveFileId: archivedWithCompression.id,
    folderId: folderIdForSupabase,
    name: archivedWithCompression.name,
    mimeType: archivedWithCompression.mimeType,
    originalSizeBytes: archivedWithCompression.originalBytes,
    compressedSizeBytes: archivedWithCompression.storedBytes,
    uploadedBy,
  });

  if (import.meta.env.DEV) {
    const nowIso = new Date().toISOString();
    console.info("[acadex:supabase:files:metadata]", {
      drive_file_id: archivedWithCompression.id,
      folder_id: folderIdForSupabase,
      name: archivedWithCompression.name,
      mime_type: archivedWithCompression.mimeType,
      original_size_bytes: archivedWithCompression.originalBytes,
      compressed_size_bytes: archivedWithCompression.storedBytes,
      compression_ratio: archivedWithCompression.compressionRatio,
      tags: archivedWithCompression.tags ?? null,
      uploaded_by: uploadedBy,
      uploaded_at: nowIso,
      drive_synced_at: nowIso,
      is_deleted_on_drive: false,
    });
  }

  files = [archivedWithCompression, ...files.filter((f) => f.id !== archived.id)];
  return archivedWithCompression;
}

function detectKind(mimeType: string, name: string): FileKind {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (name.toLowerCase().endsWith(".docx")) return "docx";
  if (name.toLowerCase().endsWith(".pptx")) return "pptx";
  return "other";
}

export async function uploadFolder(
  fileList: FileList,
  onProgress?: (done: number, total: number) => void
): Promise<FolderUploadSummary> {
  const filesToUpload = Array.from(fileList) as Array<File & { webkitRelativePath?: string }>;
  if (filesToUpload.length === 0) {
    return { succeeded: 0, failed: 0, totalOriginalBytes: 0, totalStoredBytes: 0 };
  }

  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();
  const uploadedBy = isUuid(supabaseUser?.id)
    ? supabaseUser!.id
    : isUuid(currentUser?.id)
      ? currentUser!.id
      : getStableUploadedByFallback(currentUser?.id);

  const firstPath = (filesToUpload[0].webkitRelativePath || filesToUpload[0].name).replace(/\\/g, "/");
  const rootFolderName = firstPath.split("/").filter(Boolean)[0] || "Uploaded Folder";
  const driveParentId = "root";

  const rootDriveFolder = await createDriveFolder(rootFolderName, driveParentId, uploadedBy);
  const rootSupabaseFolder = await createFolderRecord({
    driveFolderId: rootDriveFolder.id,
    name: rootFolderName,
    parentFolderId: null,
    createdBy: uploadedBy,
  });

  const nowIso = new Date().toISOString();
  if (!folders.find((folder) => folder.id === rootSupabaseFolder.id)) {
    folders = [
      {
        id: rootSupabaseFolder.id,
        name: rootFolderName,
        ownerId: uploadedBy,
        color: "green",
        createdAt: nowIso,
        parentFolderId: null,
      },
      ...folders,
    ];
  }

  const folderCache = new Map<string, { driveId: string; supabaseId: string }>();
  folderCache.set(rootFolderName, {
    driveId: rootDriveFolder.id,
    supabaseId: rootSupabaseFolder.id,
  });

  const ensureFolder = async (folderPath: string): Promise<{ driveId: string; supabaseId: string }> => {
    const normalized = folderPath.replace(/\\/g, "/").split("/").filter(Boolean).join("/");
    if (!normalized) {
      return {
        driveId: rootDriveFolder.id,
        supabaseId: rootSupabaseFolder.id,
      };
    }

    const parts = normalized.split("/");
    let built = "";
    let parentDriveId = driveParentId;
    let parentSupabaseId: string | null = null;

    for (const part of parts) {
      built = built ? `${built}/${part}` : part;
      const cached = folderCache.get(built);
      if (cached) {
        parentDriveId = cached.driveId;
        parentSupabaseId = cached.supabaseId;
        continue;
      }

      const createdDriveFolder = await createDriveFolder(part, parentDriveId, uploadedBy);
      const createdSupabaseFolder = await createFolderRecord({
        driveFolderId: createdDriveFolder.id,
        name: part,
        parentFolderId: parentSupabaseId,
        createdBy: uploadedBy,
      });

      folderCache.set(built, {
        driveId: createdDriveFolder.id,
        supabaseId: createdSupabaseFolder.id,
      });

      if (!folders.find((folder) => folder.id === createdSupabaseFolder.id)) {
        folders = [
          {
            id: createdSupabaseFolder.id,
            name: part,
            ownerId: uploadedBy,
            color: "green",
            createdAt: new Date().toISOString(),
            parentFolderId: parentSupabaseId,
          },
          ...folders,
        ];
      }

      parentDriveId = createdDriveFolder.id;
      parentSupabaseId = createdSupabaseFolder.id;
    }

    return folderCache.get(normalized)!;
  };

  let succeeded = 0;
  let failed = 0;
  let totalOriginalBytes = 0;
  let totalStoredBytes = 0;
  const uploadedFiles: ArchivedFile[] = [];

  for (let i = 0; i < filesToUpload.length; i += 1) {
    const file = filesToUpload[i];
    const relativePath = (file.webkitRelativePath || `${rootFolderName}/${file.name}`).replace(/\\/g, "/");
    const pathParts = relativePath.split("/").filter(Boolean);
    const parentRelativePath =
      pathParts.length > 1 ? pathParts.slice(0, -1).join("/") : rootFolderName;

    try {
      const parentFolder = await ensureFolder(parentRelativePath);
      const compression = await compressFile(file);

      const driveFile = await uploadFileToDrive(
        compression.compressedFile,
        parentFolder.driveId,
        parentFolder.supabaseId,
        uploadedBy
      );

      await createFileRecord({
        driveFileId: driveFile.id,
        folderId: parentFolder.supabaseId,
        name: file.name,
        mimeType: driveFile.mimeType || file.type || "application/octet-stream",
        originalSizeBytes: compression.originalSize,
        compressedSizeBytes: compression.compressedSize,
        uploadedBy,
      });

      const compressionRatio =
        compression.originalSize > 0
          ? (compression.originalSize - compression.compressedSize) / compression.originalSize
          : 0;

      const mimeType = driveFile.mimeType || file.type || "application/octet-stream";
      const createdAt = driveFile.createdTime || new Date().toISOString();

      uploadedFiles.push({
        id: driveFile.id,
        name: driveFile.name || file.name,
        kind: detectKind(mimeType, file.name),
        mimeType,
        ownerId: uploadedBy,
        originalBytes: compression.originalSize,
        storedBytes: compression.compressedSize,
        compressionRatio,
        tags: [],
        createdAt,
        updatedAt: createdAt,
        previewUrl: `https://drive.google.com/file/d/${driveFile.id}/view`,
        downloadUrl: `https://drive.google.com/uc?export=download&id=${driveFile.id}`,
        folderId: parentFolder.supabaseId,
      });

      succeeded += 1;
      totalOriginalBytes += compression.originalSize;
      totalStoredBytes += compression.compressedSize;
    } catch (error) {
      console.error(`[uploadFolder] Failed to upload ${relativePath}:`, error);
      failed += 1;
    }

    onProgress?.(i + 1, filesToUpload.length);
  }

  if (uploadedFiles.length > 0) {
    const uploadedIds = new Set(uploadedFiles.map((file) => file.id));
    files = [...uploadedFiles, ...files.filter((file) => !uploadedIds.has(file.id))];
  }

  return {
    succeeded,
    failed,
    totalOriginalBytes,
    totalStoredBytes,
  };
}

export async function deleteFile(id: string): Promise<void> {
  await driveDelete(id);
  files = files.filter((f) => f.id !== id);
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

// --- Folders ---
export async function listFolders(parentFolderId?: string | null): Promise<Folder[]> {
  await sleep();
  let result = [...folders];
  if (typeof parentFolderId === "string") {
    result = result.filter((f) => f.parentFolderId === parentFolderId);
  } else if (parentFolderId === null) {
    result = result.filter((f) => f.parentFolderId === null || f.parentFolderId === undefined);
  }
  return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getFolder(id: string): Promise<Folder> {
  await sleep();
  const folder = folders.find((f) => f.id === id);
  if (!folder) throw apiError("not_found", `Folder ${id} not found`);
  return folder;
}

export async function createFolder(
  name: string,
  color?: FolderColor,
  parentFolderId?: string | null
): Promise<Folder> {
  await sleep();
  if (parentFolderId !== null && parentFolderId !== undefined && !folders.find((f) => f.id === parentFolderId)) {
    throw apiError("not_found", `Parent folder ${parentFolderId} not found`);
  }
  const folder: Folder = {
    id: `folder_${Math.random().toString(36).slice(2, 10)}`,
    name,
    ownerId: currentUser?.id ?? "admin_reyes",
    color: color ?? "green",
    createdAt: new Date().toISOString(),
    parentFolderId: parentFolderId ?? null,
  };
  folders = [folder, ...folders];
  return folder;
}

export async function moveFileToFolder(
  fileId: string,
  folderId: string | null
): Promise<ArchivedFile> {
  await sleep();
  const file = files.find((f) => f.id === fileId);
  if (!file) throw apiError("not_found", `File ${fileId} not found`);
  if (folderId !== null && !folders.find((f) => f.id === folderId)) {
    throw apiError("not_found", `Folder ${folderId} not found`);
  }
  file.folderId = folderId;
  return file;
}

export async function deleteFolder(id: string): Promise<void> {
  await sleep();
  const before = folders.length;
  folders = folders.filter((f) => f.id !== id);
  if (folders.length === before) throw apiError("not_found", `Folder ${id} not found`);
  for (const file of files) {
    if (file.folderId === id) file.folderId = null;
  }
}

// --- Impact ---
export async function getImpactStats(): Promise<ImpactStats> {
  await sleep();
  return mockImpact;
}
