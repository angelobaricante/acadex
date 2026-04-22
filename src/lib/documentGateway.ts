// documentGateway.ts
// Fetches files directly from Google Drive using the user's existing OAuth token.
// No backend server or VITE_DOCUMENT_API_BASE_URL required.

const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";

export interface DocumentMetadata {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes?: number;
  canPreview: boolean;
  canDownload: boolean;
}

export interface DocumentGatewayError {
  status: number;
  message: string;
}

// ─── Token ────────────────────────────────────────────────────────────────────

function getToken(): string | null {
  return window.__acadex_token ?? null;
}

// ─── Gateway is "enabled" as long as the user has a valid OAuth token.
// This replaces the old VITE_DOCUMENT_API_BASE_URL check so FilePreview.tsx
// stops showing the "Configure VITE_DOCUMENT_API_BASE_URL" fallback.

export function isDocumentGatewayEnabled(): boolean {
  return Boolean(getToken());
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function fetchDocumentMetadata(fileId: string): Promise<DocumentMetadata> {
  const token = getToken();
  if (!token) throw { status: 401, message: "User is not signed in." } as DocumentGatewayError;

  const params = new URLSearchParams({
    fields: "id,name,mimeType,size,capabilities(canDownload)",
  });

  const res = await fetch(`${DRIVE_FILES_URL}/${encodeURIComponent(fileId)}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const error: DocumentGatewayError = {
      status: res.status,
      message: `Drive metadata fetch failed (${res.status})`,
    };
    throw error;
  }

  const data = await res.json() as {
    id: string;
    name: string;
    mimeType: string;
    size?: string;
    capabilities?: { canDownload?: boolean };
  };

  const previewableMimeTypes = [
    "application/pdf",
    "image/",
    "video/",
  ];

  const canPreview = previewableMimeTypes.some((prefix) =>
    data.mimeType.startsWith(prefix)
  );

  return {
    id: data.id,
    name: data.name,
    mimeType: data.mimeType,
    sizeBytes: data.size ? parseInt(data.size, 10) : undefined,
    canPreview,
    canDownload: data.capabilities?.canDownload ?? true,
  };
}

// ─── Blob (used by FilePreview.tsx for inline preview) ────────────────────────

export async function fetchDocumentBlob(fileId: string): Promise<Blob> {
  const token = getToken();
  if (!token) throw { status: 401, message: "User is not signed in." } as DocumentGatewayError;

  const params = new URLSearchParams({ alt: "media" });

  const res = await fetch(`${DRIVE_FILES_URL}/${encodeURIComponent(fileId)}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const error: DocumentGatewayError = {
      status: res.status,
      message: `Drive file fetch failed (${res.status})`,
    };
    throw error;
  }

  return res.blob();
}