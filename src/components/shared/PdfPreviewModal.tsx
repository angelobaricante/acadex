import { Suspense, lazy, useEffect, useState } from "react";
import { Download, FileText, Info, MoreHorizontal, Share2, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import FilePreviewLoader from "@/components/shared/FilePreviewLoader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import type { ArchivedFile } from "@/lib/types";
import { fetchDocumentBlob, isDocumentGatewayEnabled } from "@/lib/documentGateway";

const LazyReactPdfViewer = lazy(() => import("@/components/shared/ReactPdfViewer"));

interface RenderPreviewArgs {
  file: ArchivedFile;
  viewerUrl: string;
  blobError: boolean;
  gatewayEnabled: boolean;
  onClose: () => void;
}

function renderPreview({ file, viewerUrl, blobError, gatewayEnabled, onClose }: RenderPreviewArgs) {
  if (blobError) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6">
        <p className="text-[13px] text-muted-foreground">
          Could not load this preview. Try downloading it instead.
        </p>
      </div>
    );
  }

  const loading = gatewayEnabled && !viewerUrl;
  if (loading) {
    return <FilePreviewLoader kind={file.kind} fileName={file.name} />;
  }

  if (!viewerUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6">
        <p className="text-[13px] text-muted-foreground">Preview not available.</p>
      </div>
    );
  }

  function handleBackgroundClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  if (file.kind === "pdf") {
    return (
      <div key={viewerUrl} className="preview-reveal h-full w-full">
        <LazyReactPdfViewer fileUrl={viewerUrl} fileName={file.name} onBackgroundClick={onClose} />
      </div>
    );
  }

  if (file.kind === "image") {
    return (
      <div
        key={viewerUrl}
        className="preview-reveal flex h-full w-full items-center justify-center px-4 pb-24 pt-16 sm:px-6 sm:pt-20"
        onClick={handleBackgroundClick}
      >
        <img
          src={viewerUrl}
          alt={file.name}
          className="max-h-full max-w-full rounded-lg object-contain shadow-[0_20px_45px_-28px_rgba(0,0,0,0.65)]"
        />
      </div>
    );
  }

  if (file.kind === "video") {
    return (
      <div
        key={viewerUrl}
        className="preview-reveal flex h-full w-full items-center justify-center px-4 pb-24 pt-16 sm:px-6 sm:pt-20"
        onClick={handleBackgroundClick}
      >
        <video
          src={viewerUrl}
          controls
          autoPlay
          className="max-h-full max-w-full rounded-lg bg-black shadow-[0_20px_45px_-28px_rgba(0,0,0,0.65)]"
        />
      </div>
    );
  }

  // docx / pptx / other — no inline preview, show download fallback.
  return (
    <div
      key={viewerUrl}
      className="preview-reveal flex h-full w-full items-center justify-center p-6"
      onClick={handleBackgroundClick}
    >
      <div className="flex max-w-md flex-col items-center gap-4 rounded-xl border bg-background/95 px-6 py-8 text-center shadow-lg backdrop-blur">
        <div className="flex size-11 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border/70">
          <FileText className="size-5" strokeWidth={1.6} />
        </div>
        <div className="space-y-1">
          <p className="text-[13.5px] font-medium text-foreground">{file.name}</p>
          <p className="text-[12.5px] text-muted-foreground">
            Preview isn't available for this file type. Download to open it.
          </p>
        </div>
        <Button asChild size="sm" className="h-8 gap-1.5 rounded-full px-3 text-[12px]">
          <a href={file.downloadUrl} download={file.name}>
            <Download className="size-[13px]" strokeWidth={1.9} />
            Download
          </a>
        </Button>
      </div>
    </div>
  );
}

interface PdfPreviewModalProps {
  open: boolean;
  file: ArchivedFile | null;
  onOpenChange: (open: boolean) => void;
  onShare?: (file: ArchivedFile) => void;
  onDetails?: (file: ArchivedFile) => void;
  onDelete?: (file: ArchivedFile) => Promise<void> | void;
}

export default function PdfPreviewModal({
  open,
  file,
  onOpenChange,
  onShare,
  onDetails,
  onDelete,
}: PdfPreviewModalProps) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [blobError, setBlobError] = useState(false);

  const fileId = file?.id ?? null;
  const gatewayEnabled = isDocumentGatewayEnabled();

  useEffect(() => {
    if (!fileId || !gatewayEnabled) {
      setBlobUrl(null);
      setBlobError(false);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    setBlobUrl(null);
    setBlobError(false);

    void (async () => {
      try {
        const blob = await fetchDocumentBlob(fileId);
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      } catch {
        if (!cancelled) setBlobError(true);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId, gatewayEnabled]);

  if (!file) return null;
  const currentFile = file;

  const viewerUrl = blobUrl ?? (!gatewayEnabled ? currentFile.previewUrl : "");

  function handleShare() {
    if (onShare) {
      onShare(currentFile);
      return;
    }
    window.open(currentFile.previewUrl, "_blank", "noopener,noreferrer");
  }

  function handleDetails() {
    if (onDetails) {
      onDetails(currentFile);
      return;
    }
    window.open(currentFile.previewUrl, "_blank", "noopener,noreferrer");
  }

  async function handleDelete() {
    if (!onDelete) return;
    await onDelete(currentFile);
  }

  return (<>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        role="dialog"
        aria-modal="true"
        showCloseButton={false}
        overlayClassName="bg-transparent"
        className="inset-0 h-screen w-screen max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-none border-0 bg-transparent p-0 shadow-none ring-0 sm:max-w-none"
      >
        <DialogTitle className="sr-only">Preview {file.name}</DialogTitle>

        <div className="relative flex h-full min-h-0 w-full flex-col bg-transparent">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-black/75 supports-[backdrop-filter]:backdrop-blur-[2px]"
          />

          <div className="pointer-events-none absolute inset-x-4 top-3 z-30 flex items-center justify-between gap-3 sm:inset-x-6 sm:top-4">
            <p className="min-w-0 truncate text-[12.5px] font-medium text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] sm:text-[13.5px]">
              {file.name}
            </p>

            <div className="pointer-events-auto flex shrink-0 items-center gap-1">
              <Button
                type="button"
                size="sm"
                className="h-8 gap-1.5 rounded-full bg-primary px-3 text-[12px] text-primary-foreground hover:bg-primary/90"
                onClick={handleShare}
              >
                <Share2 className="size-[13px]" strokeWidth={1.9} />
                <span className="hidden sm:inline">Share</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full text-white hover:bg-white/15 hover:text-white"
                    aria-label="More actions"
                  >
                    <MoreHorizontal className="size-4" strokeWidth={1.9} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 p-1">
                  <DropdownMenuItem
                    onSelect={handleDetails}
                    className="gap-2 px-2 py-1.5 text-[13px]"
                  >
                    <Info className="size-[14px] text-muted-foreground" strokeWidth={1.8} />
                    <span>Details</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="gap-2 px-2 py-1.5 text-[13px]">
                    <a href={file.downloadUrl} download={file.name}>
                      <Download className="size-[14px] text-muted-foreground" strokeWidth={1.8} />
                      <span>Download</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setConfirmDeleteOpen(true)}
                    disabled={!onDelete}
                    className="gap-2 px-2 py-1.5 text-[13px]"
                  >
                    <Trash2 className="size-[14px]" strokeWidth={1.8} />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-full text-white hover:bg-white/15 hover:text-white"
                onClick={() => onOpenChange(false)}
                aria-label="Close preview"
              >
                <X className="size-4" strokeWidth={1.9} />
              </Button>
            </div>
          </div>

          <div
            className="relative z-10 min-h-0 flex-1 bg-transparent"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                onOpenChange(false);
              }
            }}
          >
            <Suspense
              fallback={<FilePreviewLoader kind={currentFile.kind} fileName={currentFile.name} />}
            >
              {renderPreview({
                file: currentFile,
                viewerUrl,
                blobError,
                gatewayEnabled,
                onClose: () => onOpenChange(false),
              })}
            </Suspense>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <ConfirmDialog
      open={confirmDeleteOpen}
      onOpenChange={setConfirmDeleteOpen}
      title="Delete file?"
      description={`"${file.name}" will be permanently deleted and cannot be recovered.`}
      confirmLabel="Delete file"
      onConfirm={() => void handleDelete()}
    />
  </>);
}
