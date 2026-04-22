const DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files";
const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";

declare global {
    interface Window {
        __acadex_token?: string;
    }
}

function getToken(): string {
    const token = window.__acadex_token;
    if (!token) {
        throw new Error("No access token. User must sign in first.");
    }
    return token;
}

export interface DriveFolderResult {
    id: string;
    name: string;
}

export interface DriveFileResult {
    id: string;
    name: string;
    size: string;
    mimeType: string;
    createdTime: string;
}

export async function createDriveFolder(
    name: string,
    parentDriveFolderId: string,
    userId: string
): Promise<DriveFolderResult> {
    const res = await fetch(DRIVE_FILES_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name,
            mimeType: "application/vnd.google-apps.folder",
            parents: [parentDriveFolderId],
            appProperties: {
                acadex_uploaded: "true",
                acadex_type: "folder",
                acadex_created_by: userId,
            },
        }),
    });

    if (!res.ok) {
        throw new Error(`Drive folder creation failed: ${res.statusText}`);
    }

    return res.json() as Promise<DriveFolderResult>;
}

export async function uploadFileToDrive(
    file: File,
    driveFolderId: string,
    supabaseFolderId: string,
    userId: string
): Promise<DriveFileResult> {
    const metadata = {
        name: file.name,
        parents: [driveFolderId],
        appProperties: {
            acadex_uploaded: "true",
            acadex_type: "file",
            acadex_folder_id: supabaseFolderId,
            acadex_user_id: userId,
            acadex_original_size: String(file.size),
        },
    };

    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("file", file);

    const res = await fetch(
        `${DRIVE_UPLOAD_URL}?uploadType=multipart&fields=id,name,size,mimeType,createdTime`,
        {
            method: "POST",
            headers: { Authorization: `Bearer ${getToken()}` },
            body: form,
        }
    );

    if (!res.ok) {
        throw new Error(`Drive upload failed: ${res.statusText}`);
    }

    return res.json() as Promise<DriveFileResult>;
}
