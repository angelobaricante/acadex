export interface FolderRow {
    id: string;
    drive_folder_id: string;
    name: string;
    parent_folder_id: string | null;
    created_by: string;
    created_at: string;
    drive_synced_at: string | null;
    is_deleted_on_drive: boolean;
}

export interface FileRow {
    id: string;
    drive_file_id: string;
    folder_id: string | null;
    name: string;
    mime_type: string | null;
    original_size_bytes: number | null;
    compressed_size_bytes: number | null;
    compression_ratio: number | null;
    tags: string[] | null;
    tags_status: string | null;
    uploaded_by: string;
    uploaded_at: string;
    drive_synced_at: string | null;
    is_deleted_on_drive: boolean;
}
