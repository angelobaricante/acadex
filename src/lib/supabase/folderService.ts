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
        } as never)
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

export async function getFolderById(folderId: string): Promise<FolderRow> {
    const { data, error } = await supabase
        .from("folders")
        .select("*")
        .eq("id", folderId)
        .single();

    if (error) {
        throw error;
    }

    return data as FolderRow;
}

export async function listFolderRecords(createdBy?: string): Promise<FolderRow[]> {
    let query = supabase
        .from("folders")
        .select("*")
        .eq("is_deleted_on_drive", false)
        .order("created_at", { ascending: false });

    if (createdBy) {
        query = query.eq("created_by", createdBy);
    }

    const { data, error } = await query;

    if (error) {
        throw error;
    }

    return data as FolderRow[];
}

export async function deleteFolderRecordById(folderId: string): Promise<void> {
    const { error } = await supabase
        .from("folders")
        .delete()
        .eq("id", folderId);

    if (error) {
        throw error;
    }
}

export async function listFolderRecordsByRootId(rootFolderId: string): Promise<FolderRow[]> {
    const all = await listFolderRecords();

    const byParent = new Map<string, FolderRow[]>();
    for (const folder of all) {
        if (!folder.parent_folder_id) continue;
        const siblings = byParent.get(folder.parent_folder_id) ?? [];
        siblings.push(folder);
        byParent.set(folder.parent_folder_id, siblings);
    }

    const root = all.find((folder) => folder.id === rootFolderId);
    if (!root) {
        return [];
    }

    const collected: FolderRow[] = [];
    const stack: FolderRow[] = [root];

    while (stack.length > 0) {
        const current = stack.pop()!;
        collected.push(current);
        const children = byParent.get(current.id) ?? [];
        for (const child of children) {
            stack.push(child);
        }
    }

    return collected;
}

export async function deleteFolderRecordByDriveId(driveFolderId: string): Promise<void> {
    const { error } = await supabase
        .from("folders")
        .delete()
        .eq("drive_folder_id", driveFolderId);

    if (error) {
        throw error;
    }
}
