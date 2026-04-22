import type { ChangeEvent } from "react";
import { useFileUpload } from "../hooks/useFileUpload";

interface FileUploaderProps {
    supabaseFolderId: string;
    driveFolderId: string;
}

export function FileUploader({ supabaseFolderId, driveFolderId }: FileUploaderProps) {
    const { stage, error, result, uploadFile, reset } = useFileUpload();

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }

        await uploadFile(file, supabaseFolderId, driveFolderId);
    };

    if (stage === "uploading") {
        return <p>Uploading...</p>;
    }

    if (stage === "error") {
        return (
            <p>
                Error: {error} <button onClick={reset}>Retry</button>
            </p>
        );
    }

    if (stage === "done") {
        return (
            <p>
                {result?.name} uploaded! <button onClick={reset}>Upload another</button>
            </p>
        );
    }

    return (
        <input
            type="file"
            onChange={(e) => {
                void handleFileChange(e);
            }}
            accept=".pdf,.pptx,.docx,.mp4,.jpg,.png"
        />
    );
}
