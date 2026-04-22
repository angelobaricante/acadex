import { useEffect, useRef, useState } from "react";
import { Check, CheckCircle2, ChevronDown, FileImage, FileText, FileUp, FileVideo, Folder as FolderIcon, FolderPlus, Presentation, XCircle, type LucideIcon } from "lucide-react";
import BrandSpinner from "@/components/shared/BrandSpinner";
import { formatBytes } from "@/lib/format";
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
import { showFileUploadToast } from "@/components/shared/uploadToast";

function fileKindFromName(name: string): { Icon: LucideIcon; color: string; bg: string } {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return { Icon: FileText, color: "text-red-500", bg: "bg-red-50/80" };
  if (ext === "docx" || ext === "doc") return { Icon: FileText, color: "text-blue-500", bg: "bg-blue-50/80" };
  if (ext === "pptx" || ext === "ppt") return { Icon: Presentation, color: "text-orange-500", bg: "bg-orange-50/80" };
  if (["png", "jpg", "jpeg", "gif", "webp", "heic"].includes(ext))
    return { Icon: FileImage, color: "text-emerald-500", bg: "bg-emerald-50/80" };
  if (["mp4", "mov", "webm", "m4v"].includes(ext))
    return { Icon: FileVideo, color: "text-purple-500", bg: "bg-purple-50/80" };
  return { Icon: FileText, color: "text-slate-500", bg: "bg-slate-50/80" };
}

export default function UploadDialog() {
  const uploadDialogOpen = useUIStore((s) => s.uploadDialogOpen);
  const closeUpload = useUIStore((s) => s.closeUpload);
  const currentFolderId = useUIStore((s) => s.currentFolderId);

  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);

  type UploadItem = {
    name: string;
    originalBytes: number;
    status: "compressing" | "done" | "error";
    storedBytes?: number;
    savedPercent?: number;
  };
  const [items, setItems] = useState<UploadItem[]>([]);
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
      setUploading(false);
      setDragOver(false);
      setItems([]);
    }
  }, [uploadDialogOpen]);

  const targetFolder = folders.find((f) => f.id === targetFolderId) ?? null;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    setUploading(true);
    setItems(
      files.map((f) => ({
        name: f.name,
        originalBytes: f.size,
        status: "compressing" as const,
      }))
    );

    let succeededCount = 0;
    let totalOriginal = 0;
    let totalStored = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const result = await uploadFile(file, targetFolderId);
          if (targetFolderId) {
            try {
              await moveFileToFolder(result.id, targetFolderId);
            } catch {
              toast.error(`Couldn't move ${file.name} to '${targetFolder?.name ?? "folder"}'`);
            }
          }

          setItems((prev) =>
            prev.map((it, idx) =>
              idx === i
                ? {
                    ...it,
                    status: "done" as const,
                    originalBytes: result.originalBytes,
                    storedBytes: result.storedBytes,
                    savedPercent: Math.round((result.compressionRatio ?? 0) * 100),
                  }
                : it
            )
          );

          if (files.length === 1) {
            showFileUploadToast({
              name: result.name ?? file.name,
              originalBytes: result.originalBytes,
              storedBytes: result.storedBytes,
              compressionRatio: result.compressionRatio,
              targetFolderName: targetFolder?.name,
            });
          }

          succeededCount++;
          totalOriginal += result.originalBytes;
          totalStored += result.storedBytes;
        } catch {
          setItems((prev) =>
            prev.map((it, idx) => (idx === i ? { ...it, status: "error" as const } : it))
          );
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      if (files.length > 1 && succeededCount > 0) {
        const { showFolderUploadToast } = await import("@/components/shared/uploadToast");
        showFolderUploadToast({
          fileCount: succeededCount,
          totalOriginalBytes: totalOriginal,
          totalStoredBytes: totalStored,
          totalCompressionRatio: totalOriginal > 0 ? (totalOriginal - totalStored) / totalOriginal : 0,
          targetFolderName: targetFolder?.name,
        });
      }

      useUIStore.getState().bumpUploadsVersion();
      if (targetFolderId) {
        useUIStore.getState().bumpFoldersVersion();
      }
      // Keep the dialog open briefly so the user can see the final totals.
      if (files.length === 1) {
        closeUpload();
      }
    } finally {
      setUploading(false);
    }
  }

  const totalSavedPct = (() => {
    const doneItems = items.filter((it) => it.status === "done" && it.storedBytes !== undefined);
    if (doneItems.length === 0) return null;
    const orig = doneItems.reduce((s, it) => s + it.originalBytes, 0);
    const stored = doneItems.reduce((s, it) => s + (it.storedBytes ?? 0), 0);
    if (orig <= 0) return null;
    return {
      percent: Math.round(((orig - stored) / orig) * 100),
      savedBytes: orig - stored,
      doneCount: doneItems.length,
    };
  })();

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (uploading) return;
    void handleFiles(e.dataTransfer.files);
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
                disabled={uploading}
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

        {items.length > 0 ? (
          <div className="flex min-w-0 flex-col gap-2.5">
            <div className="max-h-[280px] min-w-0 overflow-y-auto overflow-x-hidden pr-1">
              <ul className="flex min-w-0 flex-col gap-1.5">
                {items.map((item, i) => {
                  const { Icon, color, bg } = fileKindFromName(item.name);
                  const sizeLabel =
                    item.status === "done" && item.storedBytes !== undefined
                      ? `${formatBytes(item.originalBytes)} → ${formatBytes(item.storedBytes)}`
                      : item.status === "error"
                      ? "Failed"
                      : formatBytes(item.originalBytes);
                  return (
                    <li
                      key={`${item.name}-${i}`}
                      className="flex min-w-0 flex-col gap-2 rounded-lg border border-border/70 bg-white/80 px-3 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-md ring-1 ring-border/70",
                            bg,
                            color
                          )}
                        >
                          <Icon className="size-[13px]" strokeWidth={1.8} />
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-[12.5px] font-medium leading-tight text-foreground">
                            {item.name}
                          </span>
                          <span className="mt-0.5 truncate text-[10.5px] tabular-nums text-muted-foreground">
                            {sizeLabel}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {item.status === "done" && item.savedPercent !== undefined && (
                            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-primary">
                              {item.savedPercent}%
                            </span>
                          )}
                          {item.status === "done" ? (
                            <CheckCircle2 className="size-[15px] text-primary" strokeWidth={2} />
                          ) : item.status === "error" ? (
                            <XCircle className="size-[15px] text-destructive" strokeWidth={2} />
                          ) : (
                            <BrandSpinner size={15} />
                          )}
                        </div>
                      </div>
                      <div className="relative h-1 w-full overflow-hidden rounded-full bg-muted/80">
                        {item.status === "compressing" ? (
                          <div className="preview-loader-progress-fill absolute inset-y-0 left-0 w-full origin-left rounded-full bg-[linear-gradient(90deg,transparent_0%,hsl(142_75%_58%)_40%,hsl(142_65%_45%)_60%,transparent_100%)]" />
                        ) : (
                          <div
                            className={cn(
                              "absolute inset-y-0 left-0 w-full rounded-full",
                              item.status === "error" ? "bg-destructive/70" : "bg-primary"
                            )}
                          />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            {totalSavedPct && (
              <div className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-[12px]">
                <span className="truncate text-muted-foreground">
                  {totalSavedPct.doneCount} of {items.length} compressed
                </span>
                <span className="shrink-0 font-medium tabular-nums text-primary">
                  Saved {formatBytes(totalSavedPct.savedBytes)} · {totalSavedPct.percent}%
                </span>
              </div>
            )}
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            aria-disabled={uploading}
            onClick={() => {
              if (!uploading) inputRef.current?.click();
            }}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !uploading) {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (!uploading) setDragOver(true);
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
                : "border-primary/30 bg-[hsl(48_25%_98%)] hover:border-primary/50 hover:bg-primary/[0.04]",
              uploading && "cursor-not-allowed opacity-80"
            )}
          >
            <div
              className={cn(
                "flex size-11 items-center justify-center rounded-lg bg-white/80 text-primary",
                "ring-1 ring-border/70 shadow-[0_1px_0_rgba(16,24,40,0.02),0_1px_2px_rgba(16,24,40,0.04)]"
              )}
            >
              {uploading ? (
                <BrandSpinner size={26} />
              ) : (
                <FileUp className="size-5" strokeWidth={1.6} />
              )}
            </div>
            <p className="text-[13.5px] font-medium text-foreground">
              {uploading ? "Compressing…" : "Drop files here or click to browse"}
            </p>
            <p className="text-[11.5px] text-muted-foreground">
              PDF, DOCX, PPTX, images, video
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />

        <div className="flex justify-end">
          <Button variant="ghost" onClick={closeUpload} disabled={uploading}>
            {items.length > 0 && !uploading ? "Done" : "Close"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
