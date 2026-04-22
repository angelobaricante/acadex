import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import type { ArchivedFile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { fetchDocumentBlob, isDocumentGatewayEnabled } from "@/lib/documentGateway";

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
  const [blobPreviewUrl, setBlobPreviewUrl] = useState<string | null>(null);
  const [loadingSecurePreview, setLoadingSecurePreview] = useState(false);
  const gatewayEnabled = isDocumentGatewayEnabled();

  const supportsInlinePreview =
    file.kind === "pdf" || file.kind === "image" || file.kind === "video";
  const isDriveHostedPreview = /(^|\.)drive\.google\.com$/i.test(
    (() => {
      try {
        return new URL(file.previewUrl).hostname;
      } catch {
        return "";
      }
    })()
  );

  // Reset failed state when the file changes.
  useEffect(() => {
    setFailed(false);
  }, [file.id]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    setBlobPreviewUrl(null);

    if (!supportsInlinePreview || !gatewayEnabled) {
      setLoadingSecurePreview(false);
      return () => {
        // No resources to clean up when secure preview is disabled.
      };
    }

    setLoadingSecurePreview(true);
    void (async () => {
      try {
        const blob = await fetchDocumentBlob(file.id);
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobPreviewUrl(objectUrl);
      } catch {
        if (cancelled) return;
        setFailed(true);
      } finally {
        if (!cancelled) {
          setLoadingSecurePreview(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [file.id, gatewayEnabled, supportsInlinePreview]);

  const allowLegacyPreview = !gatewayEnabled && !isDriveHostedPreview;
  const previewSrc = blobPreviewUrl ?? (allowLegacyPreview ? file.previewUrl : "");

  if (loadingSecurePreview) {
    return <Fallback message="Loading preview..." />;
  }

  if (!gatewayEnabled && isDriveHostedPreview && supportsInlinePreview) {
    return (
      <Fallback message="Sign in with Google to load this preview." />
    );
  }

  if (!previewSrc || failed) {
    return <Fallback message="Preview not available" />;
  }

  if (file.kind === "image") {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <img
          src={previewSrc}
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
          src={previewSrc}
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
        src={previewSrc}
        title={file.name}
        className="h-full w-full border-0 bg-white"
      />
    );
  }

  // docx / pptx / other
  return <Fallback message="Preview requires download for this file type." />;
}
