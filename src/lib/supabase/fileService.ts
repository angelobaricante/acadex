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
            ? parseFloat(
                ((originalSizeBytes - compressedSizeBytes) / originalSizeBytes).toFixed(2)
            )
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
        .insert(insertPayload)
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
        .update({ folder_id: null })
        .eq("folder_id", folderId);

    if (error) {
        throw error;
    }
}
