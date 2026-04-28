import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, FileUp, Folder as FolderIcon, FolderPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/store";
import { createFolder, listFolders, moveFileToFolder, uploadFile } from "@/lib/api";
import { Input } from "@/components/ui/input";
import {
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { Folder } from "@/lib/types";
import { toast } from "sonner";
import {
  showCompressionProgressToast,
  showFileUploadToast,
  showFolderUploadToast,
} from "@/components/shared/uploadToast";

function isAbortError(error: unknown): boolean {
  return (error as { name?: string } | undefined)?.name === "AbortError";
}

// Runs a batch of uploads as a background task, driving a single progress
// toast. The toast is replaced in place by the success toast on completion,
// so compressing no longer blocks the user behind a modal.
async function runUploadBatch(
  files: File[],
  targetFolderId: string | null,
  targetFolderName: string | null | undefined,
) {
  const toastId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const controller = new AbortController();
  const onCancel = () => {
    controller.abort();
  };

  showCompressionProgressToast({
    id: toastId,
    name: files[0].name,
    progressPercent: 0,
    fileIndex: 1,
    totalFiles: files.length,
    targetFolderName,
    onCancel,
  });

  let succeededCount = 0;
  let totalOriginal = 0;
  let totalStored = 0;
  let lastResult: Awaited<ReturnType<typeof uploadFile>> | null = null;
  let cancelled = false;

  for (let i = 0; i < files.length; i++) {
    if (controller.signal.aborted) {
      cancelled = true;
      break;
    }
    const file = files[i];
    try {
      const result = await uploadFile(
        file,
        targetFolderId,
        (progress) => {
          showCompressionProgressToast({
            id: toastId,
            name: file.name,
            progressPercent: progress,
            fileIndex: i + 1,
            totalFiles: files.length,
            targetFolderName,
            onCancel,
            cancelling: controller.signal.aborted,
          });
        },
        controller.signal
      );
      if (targetFolderId) {
        try {
          await moveFileToFolder(result.id, targetFolderId);
        } catch {
          toast.error(`Couldn't move ${file.name} to '${targetFolderName ?? "folder"}'`);
        }
      }

      succeededCount++;
      totalOriginal += result.originalBytes;
      totalStored += result.storedBytes;
      lastResult = result;
    } catch (error) {
      if (isAbortError(error)) {
        cancelled = true;
        break;
      }
      toast.error(`"${file.name}" already exists in this folder.`);
    }
  }

  if (files.length === 1 && lastResult) {
    showFileUploadToast({
      id: toastId,
      name: lastResult.name ?? files[0].name,
      originalBytes: lastResult.originalBytes,
      storedBytes: lastResult.storedBytes,
      compressionRatio: lastResult.compressionRatio ?? 0,
      targetFolderName,
    });
  } else if (files.length > 1 && succeededCount > 0) {
    showFolderUploadToast({
      id: toastId,
      fileCount: succeededCount,
      totalOriginalBytes: totalOriginal,
      totalStoredBytes: totalStored,
      totalCompressionRatio:
        totalOriginal > 0 ? (totalOriginal - totalStored) / totalOriginal : 0,
      targetFolderName,
    });
  } else {
    toast.dismiss(toastId);
    if (cancelled) {
      toast("Upload cancelled");
    }
  }

  useUIStore.getState().bumpUploadsVersion();
  if (targetFolderId) {
    useUIStore.getState().bumpFoldersVersion();
  }
}

export default function UploadDialog() {
  const uploadDialogOpen = useUIStore((s) => s.uploadDialogOpen);
  const closeUpload = useUIStore((s) => s.closeUpload);
  const currentFolderId = useUIStore((s) => s.currentFolderId);

  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingSubmitting, setCreatingSubmitting] = useState(false);
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creatingFolder) {
      const id = setTimeout(() => newFolderInputRef.current?.focus(), 0);
      return () => clearTimeout(id);
    }
  }, [creatingFolder]);

  async function handleCreateFolder() {
    const name = newFolderName.trim();
    if (!name || creatingSubmitting) return;
    setCreatingSubmitting(true);
    try {
      const folder = await createFolder(name);
      setFolders((prev) => [folder, ...prev]);
      setTargetFolderId(folder.id);
      setNewFolderName("");
      setCreatingFolder(false);
      useUIStore.getState().bumpFoldersVersion();
      toast.success(`Folder '${folder.name}' created`);
    } catch {
      toast.error("Couldn't create folder");
    } finally {
      setCreatingSubmitting(false);
    }
  }

  // Load folders + seed initial target when dialog opens.
  useEffect(() => {
    if (!uploadDialogOpen) return;
    let cancelled = false;
    listFolders().then((result) => {
      if (cancelled) return;
      setFolders(result);
    });
    setTargetFolderId(currentFolderId);
    return () => {
      cancelled = true;
    };
  }, [uploadDialogOpen, currentFolderId]);

  // Reset local state when dialog closes.
  useEffect(() => {
    if (!uploadDialogOpen) {
      setDragOver(false);
    }
  }, [uploadDialogOpen]);

  const targetFolder = folders.find((f) => f.id === targetFolderId) ?? null;

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const folderId = targetFolderId;
    const folderName = targetFolder?.name ?? null;
    // Close immediately so the user can keep working while compression runs.
    closeUpload();
    void runUploadBatch(files, folderId, folderName);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <Dialog
      open={uploadDialogOpen}
      onOpenChange={(o) => {
        if (!o) closeUpload();
      }}
    >
      <DialogContent
        className={cn(
          "sm:max-w-[440px] gap-5 p-6 overflow-hidden",
          "shadow-[0_1px_0_rgba(16,24,40,0.02),0_20px_40px_-12px_rgba(16,24,40,0.18)]"
        )}
      >
        <DialogHeader className="gap-1.5">
          <DialogTitle className="text-[15px] font-semibold tracking-tight">
            Upload files
          </DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground/90">
            AcaDex compresses uploads on the fly to save space without losing fidelity.
          </DialogDescription>
        </DialogHeader>

        {/* Folder picker */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Upload to
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-full justify-start gap-2 rounded-lg px-2.5 text-[12.5px] font-normal"
              >
                <FolderIcon
                  className="size-[14px] text-muted-foreground"
                  strokeWidth={1.8}
                />
                <span className="flex-1 truncate text-left text-foreground">
                  {targetFolder ? targetFolder.name : "All files"}
                </span>
                <ChevronDown className="size-[14px] text-muted-foreground/70" strokeWidth={1.8} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-[calc(var(--radix-dropdown-menu-trigger-width))] p-1"
            >
              <DropdownMenuItem
                onSelect={() => setTargetFolderId(null)}
                className="gap-2 px-2 py-1.5 text-[13px]"
              >
                <FolderIcon
                  className="size-[14px] text-muted-foreground"
                  strokeWidth={1.8}
                />
                <span>All files</span>
                {targetFolderId === null && (
                  <Check
                    className="ml-auto size-[13px] text-primary"
                    strokeWidth={2}
                  />
                )}
              </DropdownMenuItem>
              {folders.map((folder) => (
                <DropdownMenuItem
                  key={folder.id}
                  onSelect={() => setTargetFolderId(folder.id)}
                  className="gap-2 px-2 py-1.5 text-[13px]"
                >
                  <FolderIcon
                    className="size-[14px] text-muted-foreground"
                    strokeWidth={1.8}
                  />
                  <span className="truncate">{folder.name}</span>
                  {targetFolderId === folder.id && (
                    <Check
                      className="ml-auto size-[13px] text-primary"
                      strokeWidth={2}
                    />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setCreatingFolder(true);
                }}
                className="gap-2 px-2 py-1.5 text-[13px] text-primary focus:text-primary focus:bg-primary/10"
              >
                <FolderPlus className="size-[14px]" strokeWidth={1.8} />
                <span>New folder</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {creatingFolder && (
            <div className="mt-1.5 flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/[0.04] p-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
              <FolderPlus className="ml-1 size-[14px] shrink-0 text-primary" strokeWidth={1.8} />
              <Input
                ref={newFolderInputRef}
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleCreateFolder();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setCreatingFolder(false);
                    setNewFolderName("");
                  }
                }}
                disabled={creatingSubmitting}
                maxLength={64}
                placeholder="Folder name"
                className="h-7 flex-1 border-transparent bg-transparent px-1.5 text-[12.5px] shadow-none focus-visible:border-primary/40 focus-visible:bg-white"
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setCreatingFolder(false);
                  setNewFolderName("");
                }}
                disabled={creatingSubmitting}
                className="h-7 px-2 text-[12px] text-muted-foreground"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void handleCreateFolder()}
                disabled={!newFolderName.trim() || creatingSubmitting}
                className="h-7 px-2.5 text-[12px]"
              >
                {creatingSubmitting ? "Creating…" : "Create"}
              </Button>
            </div>
          )}
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            "relative flex flex-col items-center justify-center gap-2.5 rounded-xl px-6 py-10 text-center",
            "border-2 border-dashed transition-[background-color,border-color] duration-150 ease-out",
            "cursor-pointer select-none outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring/50",
            dragOver
              ? "border-primary bg-primary/10"
              : "border-primary/30 bg-[hsl(48_25%_98%)] hover:border-primary/50 hover:bg-primary/[0.04]"
          )}
        >
          <div
            className={cn(
              "flex size-11 items-center justify-center rounded-lg bg-white/80 text-primary",
              "ring-1 ring-border/70 shadow-[0_1px_0_rgba(16,24,40,0.02),0_1px_2px_rgba(16,24,40,0.04)]"
            )}
          >
            <FileUp className="size-5" strokeWidth={1.6} />
          </div>
          <p className="text-[13.5px] font-medium text-foreground">
            Drop files here or click to browse
          </p>
          <p className="text-[11.5px] text-muted-foreground">
            PDF, DOCX, PPTX, images, video
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />

        <div className="flex justify-end">
          <Button variant="ghost" onClick={closeUpload}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
