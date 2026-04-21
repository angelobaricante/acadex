import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import type { ArchivedFile } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FilePreviewProps {
  file: ArchivedFile;
}

function Fallback({ message }: { message: string }) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-3 rounded-xl",
        "bg-muted/60 px-6 py-12 text-center"
      )}
    >
      <div
        className={cn(
          "flex size-11 items-center justify-center rounded-lg bg-white/80 text-muted-foreground",
          "ring-1 ring-border/70 shadow-[0_1px_0_rgba(16,24,40,0.02),0_1px_2px_rgba(16,24,40,0.04)]"
        )}
      >
        <FileText className="size-5" strokeWidth={1.6} />
      </div>
      <p className="text-[13px] font-medium text-muted-foreground">{message}</p>
    </div>
  );
}

export default function FilePreview({ file }: FilePreviewProps) {
  const [failed, setFailed] = useState(false);

  // Reset failed state when the file changes.
  useEffect(() => {
    setFailed(false);
  }, [file.id]);

  if (!file.previewUrl || failed) {
    return <Fallback message="Preview not available" />;
  }

  if (file.kind === "image") {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <img
          src={file.previewUrl}
          alt={file.name}
          onError={() => setFailed(true)}
          className="max-h-full max-w-full rounded-lg object-contain shadow-[0_1px_0_rgba(16,24,40,0.02),0_8px_20px_-8px_rgba(16,24,40,0.10)]"
        />
      </div>
    );
  }

  if (file.kind === "video") {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <video
          src={file.previewUrl}
          controls
          onError={() => setFailed(true)}
          className="max-h-full max-w-full rounded-lg bg-black shadow-[0_1px_0_rgba(16,24,40,0.02),0_8px_20px_-8px_rgba(16,24,40,0.10)]"
        />
      </div>
    );
  }

  if (file.kind === "pdf") {
    return (
      <iframe
        src={file.previewUrl}
        title={file.name}
        className="h-full w-full border-0 bg-white"
      />
    );
  }

  // docx / pptx / other
  return <Fallback message="Preview requires download for this file type." />;
}
