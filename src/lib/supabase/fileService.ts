import { supabase } from "../supabaseClient";
import type { FileRow } from "./types";

interface CreateFileParams {
    driveFileId: string;
    folderId: string;
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
