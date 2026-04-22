import { getAccessToken } from "./googleAuth";
import type { ArchivedFile, FileKind } from "./types";

const BASE = "https://www.googleapis.com/drive/v3";
const UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3";

function headers(): HeadersInit {
    return { Authorization: `Bearer ${getAccessToken()}` };
}

function detectKind(mimeType: string, name: string): FileKind {
    if (mimeType === "application/pdf") return "pdf";
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (name.endsWith(".docx")) return "docx";
    if (name.endsWith(".pptx")) return "pptx";
    return "other";
}

async function ensureOk(res: Response, action: string): Promise<void> {
    if (res.ok) return;
    const body = await res.text();
    throw new Error(`${action} failed (${res.status}): ${body || res.statusText}`);
}

interface DriveFileSummary {
    id: string;
    name: string;
    mimeType: string;
    size?: string;
    createdTime: string;
    modifiedTime: string;
}

interface DriveListResponse {
    files?: DriveFileSummary[];
}

// --- Upload ---
export async function driveUpload(file: File): Promise<ArchivedFile> {
    const metadata = {
        name: file.name,
        mimeType: file.type || "application/octet-stream",
    };

    const initRes = await fetch(`${UPLOAD_BASE}/files?uploadType=resumable`, {
        method: "POST",
        headers: {
            ...headers(),
            "Content-Type": "application/json",
            "X-Upload-Content-Type": file.type || "application/octet-stream",
            "X-Upload-Content-Length": String(file.size),
        },
        body: JSON.stringify(metadata),
    });
    await ensureOk(initRes, "Upload initialization");

    const uploadUrl = initRes.headers.get("Location");
    if (!uploadUrl) throw new Error("Missing resumable upload URL");

    const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
    });
    await ensureOk(uploadRes, "File upload");

    const driveFile = (await uploadRes.json()) as { id: string };

    const permRes = await fetch(`${BASE}/files/${driveFile.id}/permissions`, {
        method: "POST",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify({ role: "reader", type: "anyone" }),
    });
    await ensureOk(permRes, "Permission update");

    const now = new Date().toISOString();

    return {
        id: driveFile.id,
        name: file.name,
        kind: detectKind(file.type || "application/octet-stream", file.name),
        mimeType: file.type || "application/octet-stream",
        ownerId: "me",
        originalBytes: file.size,
        storedBytes: file.size,
        compressionRatio: 0,
        tags: ["Uploaded"],
        createdAt: now,
        updatedAt: now,
        previewUrl: `https://drive.google.com/file/d/${driveFile.id}/view`,
        downloadUrl: `https://drive.google.com/uc?export=download&id=${driveFile.id}`,
    };
}

// --- List ---
export async function driveList(query?: string): Promise<ArchivedFile[]> {
    const q = query
        ? `name contains '${query.replace(/'/g, "\\'")}' and trashed = false`
        : "trashed = false";

    const res = await fetch(
        `${BASE}/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,size,createdTime,modifiedTime)&pageSize=100`,
        { headers: headers() }
    );
    await ensureOk(res, "List files");

    const data = (await res.json()) as DriveListResponse;

    return (data.files ?? []).map((f): ArchivedFile => ({
        id: f.id,
        name: f.name,
        kind: detectKind(f.mimeType, f.name),
        mimeType: f.mimeType,
        ownerId: "me",
        originalBytes: Number(f.size ?? 0),
        storedBytes: Number(f.size ?? 0),
        compressionRatio: 0,
        tags: [],
        createdAt: f.createdTime,
        updatedAt: f.modifiedTime,
        previewUrl: `https://drive.google.com/file/d/${f.id}/view`,
        downloadUrl: `https://drive.google.com/uc?export=download&id=${f.id}`,
    }));
}

// --- Delete ---
export async function driveDelete(fileId: string): Promise<void> {
    const res = await fetch(`${BASE}/files/${fileId}`, {
        method: "DELETE",
        headers: headers(),
    });
    await ensureOk(res, "Delete file");
}
