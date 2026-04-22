import { Suspense, lazy, useState } from "react";
import { Download, FileText, Info, MoreHorizontal, Share2, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import type { ArchivedFile } from "@/lib/types";

const LazyReactPdfViewer = lazy(() => import("@/components/shared/ReactPdfViewer"));

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

  if (!file) return null;

  function handleShare() {
    if (onShare) {
      onShare(file);
      return;
    }
    window.open(file.previewUrl, "_blank", "noopener,noreferrer");
  }

  function handleDetails() {
    if (onDetails) {
      onDetails(file);
      return;
    }
    window.open(file.previewUrl, "_blank", "noopener,noreferrer");
  }

  async function handleDelete() {
    if (!onDelete) return;
    await onDelete(file);
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
            className="pointer-events-none absolute inset-0 bg-black/35 supports-[backdrop-filter]:backdrop-blur-[1px]"
          />

          <div className="pointer-events-none absolute inset-x-4 top-3 z-30 flex items-start justify-between gap-2 sm:inset-x-6 sm:top-4">
            <div className="pointer-events-auto flex min-w-0 items-center gap-2 rounded-full border bg-background/95 px-2.5 py-1.5 shadow-lg backdrop-blur">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500 ring-1 ring-red-100">
                <FileText className="size-3.5" strokeWidth={1.8} />
              </div>
              <p className="truncate text-[12.5px] font-medium text-foreground sm:text-[13.5px]">{file.name}</p>
            </div>

            <div className="pointer-events-auto flex shrink-0 items-center gap-1 rounded-full border bg-background/95 p-1 shadow-lg backdrop-blur">
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
                    className="rounded-full"
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
                className="rounded-full"
                onClick={() => onOpenChange(false)}
                aria-label="Close preview"
              >
                <X className="size-4" strokeWidth={1.9} />
              </Button>
            </div>
          </div>

          <div className="relative z-10 min-h-0 flex-1 bg-transparent">
            <Suspense
              fallback={
                <div className="h-full w-full p-4 sm:p-5">
                  <Skeleton className="h-full w-full rounded-xl" />
                </div>
              }
            >
              <LazyReactPdfViewer fileUrl={file.previewUrl} fileName={file.name} />
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
