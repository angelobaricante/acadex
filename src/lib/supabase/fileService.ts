import { supabase } from "../supabaseClient";
import type { FileRow } from "./types";

interface CreateFileParams {
    driveFileId: string;
    folderId: string | null;
    name: string;
    mimeType: string;
    originalSizeBytes: number;
    compressedSizeBytes: number;
    uploadedBy: string;
}

export async function createFileRecord(params: CreateFileParams): Promise<FileRow> {
    const {
        driveFileId,
        folderId,
        name,
        mimeType,
        originalSizeBytes,
        compressedSizeBytes,
        uploadedBy,
    } = params;

    const compressionRatio =
        originalSizeBytes > 0
            ? (originalSizeBytes - compressedSizeBytes) / originalSizeBytes
            : 0;

    const insertPayload = {
        drive_file_id: driveFileId,
        folder_id: folderId,
        name,
        mime_type: mimeType,
        original_size_bytes: originalSizeBytes,
        compressed_size_bytes: compressedSizeBytes,
        compression_ratio: compressionRatio,
        tags: null as string[] | null,
        uploaded_by: uploadedBy,
        uploaded_at: new Date().toISOString(),
        drive_synced_at: new Date().toISOString(),
        is_deleted_on_drive: false,
    };

    if (import.meta.env.DEV) {
        console.info("[acadex:supabase:files:insert]", insertPayload);
    }

    const { data, error } = await supabase
        .from("files")
        .insert(insertPayload as never)
        .select()
        .single();

    if (error) {
        throw error;
    }

    if (import.meta.env.DEV) {
        console.info("[acadex:supabase:files:inserted-row]", data);
    }

    return data as FileRow;
}

export async function getFilesByFolder(folderId: string): Promise<FileRow[]> {
    const { data, error } = await supabase
        .from("files")
        .select("*")
        .eq("folder_id", folderId)
        .eq("is_deleted_on_drive", false)
        .order("uploaded_at", { ascending: false });

    if (error) {
        throw error;
    }

    return data as FileRow[];
}

export async function getFilesByDriveIds(driveFileIds: string[]): Promise<FileRow[]> {
    if (driveFileIds.length === 0) {
        return [];
    }

    const { data, error } = await supabase
        .from("files")
        .select("*")
        .in("drive_file_id", driveFileIds)
        .eq("is_deleted_on_drive", false);

    if (error) {
        throw error;
    }

    return data as FileRow[];
}

export async function deleteFileRecordByDriveId(driveFileId: string): Promise<void> {
    const { error } = await supabase
        .from("files")
        .delete()
        .eq("drive_file_id", driveFileId);

    if (error) {
        throw error;
    }
}

export async function clearFolderFromFiles(folderId: string): Promise<void> {
    const { error } = await supabase
        .from("files")
        .update({ folder_id: null } as never)
        .eq("folder_id", folderId);

    if (error) {
        throw error;
    }
}

export async function hasDuplicateFileForUser(
    uploadedBy: string,
    name: string,
    mimeType: string,
    originalSizeBytes: number,
    folderId: string | null
): Promise<boolean> {
    let query = supabase
        .from("files")
        .select("id", { count: "exact", head: true })
        .eq("uploaded_by", uploadedBy)
        .eq("name", name)
        .eq("mime_type", mimeType)
        .eq("original_size_bytes", originalSizeBytes)
        .eq("is_deleted_on_drive", false);

    if (folderId) {
        query = query.eq("folder_id", folderId);
    } else {
        query = query.is("folder_id", null);
    }

    const { count, error } = await query;

    if (error) {
        throw error;
    }

    return (count ?? 0) > 0;
}

export async function listFilesByFolderIds(folderIds: string[]): Promise<FileRow[]> {
    if (folderIds.length === 0) {
        return [];
    }

    const { data, error } = await supabase
        .from("files")
        .select("*")
        .in("folder_id", folderIds)
        .eq("is_deleted_on_drive", false);

    if (error) {
        throw error;
    }

    return data as FileRow[];
}

export async function deleteFileRecordsByFolderIds(folderIds: string[]): Promise<void> {
    if (folderIds.length === 0) {
        return;
    }

    const { error } = await supabase
        .from("files")
        .delete()
        .in("folder_id", folderIds);

    if (error) {
        throw error;
    }
}

export async function updateFileTags(
    driveFileId: string,
    tags: string[],
    status: "done" | "failed" = "done"
): Promise<void> {
    const { error } = await supabase
        .from("files")
        .update({ tags, tags_status: status } as never)
        .eq("drive_file_id", driveFileId);

    if (error) {
        throw error;
    }

    if (import.meta.env.DEV) {
        console.info("[acadex:supabase:files:tags-updated]", { driveFileId, tags, status });
    }
}
