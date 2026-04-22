import { supabase } from "../supabaseClient";
import type { FolderRow } from "./types";

interface CreateFolderParams {
    driveFolderId: string;
    name: string;
    parentFolderId?: string | null;
    createdBy: string;
}

export async function createFolderRecord(params: CreateFolderParams): Promise<FolderRow> {
    const { driveFolderId, name, parentFolderId = null, createdBy } = params;

    const { data, error } = await supabase
        .from("folders")
        .insert({
            drive_folder_id: driveFolderId,
            name,
            parent_folder_id: parentFolderId,
            created_by: createdBy,
            drive_synced_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data as FolderRow;
}

export async function getFolderByDriveId(driveFolderId: string): Promise<FolderRow> {
    const { data, error } = await supabase
        .from("folders")
        .select("*")
        .eq("drive_folder_id", driveFolderId)
        .single();

    if (error) {
        throw error;
    }

    return data as FolderRow;
}
