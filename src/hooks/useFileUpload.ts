import { useState } from "react";
import { uploadFileToDrive } from "../lib/drive/driveApi";
import { createFileRecord } from "../lib/supabase/fileService";
import { supabase } from "../lib/supabaseClient";
import { compressFile } from "../lib/compression/compressFile";
import type { FileRow } from "../lib/supabase/types";

type UploadStage = "idle" | "uploading" | "done" | "error";

interface UseFileUploadReturn {
    stage: UploadStage;
    error: string | null;
    result: FileRow | null;
    uploadFile: (file: File, supabaseFolderId: string, driveFolderId: string) => Promise<FileRow>;
    reset: () => void;
}

export function useFileUpload(): UseFileUploadReturn {
    const [stage, setStage] = useState<UploadStage>("idle");
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<FileRow | null>(null);

    async function uploadFile(
        file: File,
        supabaseFolderId: string,
        driveFolderId: string
    ): Promise<FileRow> {
        try {
            setStage("uploading");
            setError(null);

            const compression = await compressFile(file);

            const {
                data: { user },
            } = await supabase.auth.getUser();
            const userId = user?.id ?? "anonymous";

            const driveFile = await uploadFileToDrive(
                compression.compressedFile,
                driveFolderId,
                supabaseFolderId,
                userId
            );

            const record = await createFileRecord({
                driveFileId: driveFile.id,
                folderId: supabaseFolderId,
                name: file.name,
                mimeType: file.type,
                originalSizeBytes: compression.originalSize,
                compressedSizeBytes: compression.compressedSize,
                uploadedBy: userId,
            });

            setResult(record);
            setStage("done");
            return record;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unknown error";
            setError(message);
            setStage("error");
            throw err;
        }
    }

    function reset(): void {
        setStage("idle");
        setError(null);
        setResult(null);
    }

    return { stage, error, result, uploadFile, reset };
}
