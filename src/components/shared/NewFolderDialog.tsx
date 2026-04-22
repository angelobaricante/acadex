import { useEffect, useState } from "react";
import { Check, ChevronDown, Folder as FolderIcon, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/store";
import { createFolder, listFolders } from "@/lib/api";
import type { Folder, FolderColor } from "@/lib/types";
import { toast } from "sonner";

const COLOR_OPTIONS: Array<{ value: FolderColor; label: string; dot: string }> = [
  { value: "green", label: "Green", dot: "bg-emerald-500" },
  { value: "amber", label: "Amber", dot: "bg-amber-500" },
  { value: "blue", label: "Blue", dot: "bg-sky-500" },
  { value: "violet", label: "Violet", dot: "bg-violet-500" },
  { value: "neutral", label: "Neutral", dot: "bg-muted-foreground" },
];

const FOLDER_TINT: Record<FolderColor, { text: string; bg: string; ring: string; accent: string }> = {
  green:   { text: "text-emerald-700",  bg: "bg-emerald-50",  ring: "ring-emerald-200/70",  accent: "bg-emerald-500" },
  amber:   { text: "text-amber-700",    bg: "bg-amber-50",    ring: "ring-amber-200/70",    accent: "bg-amber-500" },
  blue:    { text: "text-sky-700",      bg: "bg-sky-50",      ring: "ring-sky-200/70",      accent: "bg-sky-500" },
  violet:  { text: "text-violet-700",   bg: "bg-violet-50",   ring: "ring-violet-200/70",   accent: "bg-violet-500" },
  neutral: { text: "text-slate-600",    bg: "bg-slate-100",   ring: "ring-slate-200/70",    accent: "bg-slate-400" },
};

export default function NewFolderDialog() {
  const open = useUIStore((s) => s.newFolderDialogOpen);
  const closeNewFolder = useUIStore((s) => s.closeNewFolder);
  const bumpFoldersVersion = useUIStore((s) => s.bumpFoldersVersion);
  const currentFolderId = useUIStore((s) => s.currentFolderId);

  const [name, setName] = useState("");
  const [color, setColor] = useState<FolderColor>("green");
  const [submitting, setSubmitting] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);

  // Load folders so we can look up the current folder's name.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    listFolders().then((result) => {
      if (cancelled) return;
      setFolders(result);
    });
    return () => { cancelled = true; };
  }, [open]);

  const contextFolder = folders.find((f) => f.id === currentFolderId) ?? null;

  useEffect(() => {
    if (!open) {
      setName("");
      setColor("green");
      setSubmitting(false);
    }
  }, [open]);

  const trimmed = name.trim();
  const canSubmit = trimmed.length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await createFolder(trimmed, color, currentFolderId);
      const tint = FOLDER_TINT[color];
      toast.custom((id) => (
        <div
          className={cn(
            "flex w-[340px] items-center gap-3 rounded-xl border border-border/60 bg-white px-3.5 py-3",
            "shadow-[0_4px_24px_-4px_rgba(16,24,40,0.14),0_1px_0_rgba(16,24,40,0.02)]",
            "animate-in slide-in-from-bottom-3 fade-in duration-300"
          )}
        >
          {/* Folder icon badge */}
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 transition-colors",
              tint.bg,
              tint.ring,
              tint.text
            )}
          >
            <FolderIcon className="size-[18px]" strokeWidth={1.8} />
          </span>

          {/* Text */}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="truncate text-[13.5px] font-semibold leading-tight text-foreground">
              {trimmed}
            </p>
            <p className="text-[11.5px] leading-tight text-muted-foreground">
              Folder created · ready to use
            </p>
          </div>

          {/* Color pip + dismiss */}
          <div className="flex shrink-0 items-center gap-2">
            <span className={cn("size-2 rounded-full", tint.accent)} />
            <button
              type="button"
              onClick={() => toast.dismiss(id)}
              aria-label="Dismiss"
              className="flex size-6 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
            >
              ✕
            </button>
          </div>
        </div>
      ), { duration: 4000 });
      bumpFoldersVersion();
      closeNewFolder();
    } catch {
      toast.error("Couldn't create folder");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) closeNewFolder();
      }}
    >
      <DialogContent
        className={cn(
          "sm:max-w-[420px] gap-5 p-6",
          "shadow-[0_1px_0_rgba(16,24,40,0.02),0_20px_40px_-12px_rgba(16,24,40,0.18)]"
        )}
      >
        <DialogHeader className="gap-1.5">
          <DialogTitle className="text-[15px] font-semibold tracking-tight">
            Create folder
          </DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground/90">
            Organize files into a focused workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Create inside context row */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Create inside
            </span>
            <div className="flex h-8 w-full items-center gap-2 rounded-lg border border-border/80 bg-muted/30 px-2.5">
              <FolderIcon
                className="size-[14px] shrink-0 text-muted-foreground"
                strokeWidth={1.8}
              />
              <span className="flex-1 truncate text-[12.5px] text-foreground">
                {contextFolder ? contextFolder.name : "All files"}
              </span>
              <ChevronDown
                className="size-[14px] shrink-0 text-muted-foreground/40"
                strokeWidth={1.8}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="new-folder-name"
              className="text-[12.5px] font-medium text-foreground"
            >
              Folder name
            </Label>
            <Input
              id="new-folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CS 101 Lectures"
              autoFocus
              disabled={submitting}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSubmit) {
                  e.preventDefault();
                  void handleSubmit();
                }
              }}
              className="h-9 text-[13.5px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-medium text-foreground">
              Color
            </span>
            <div role="radiogroup" aria-label="Folder color" className="flex items-center gap-2">
              {COLOR_OPTIONS.map((opt) => {
                const active = color === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={opt.label}
                    onClick={() => setColor(opt.value)}
                    disabled={submitting}
                    className={cn(
                      "relative flex size-7 items-center justify-center rounded-full transition-[box-shadow,transform] duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                      active
                        ? "ring-2 ring-offset-2 ring-offset-background ring-primary/60"
                        : "hover:scale-105"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn("size-4 rounded-full", opt.dot)}
                    />
                    {active && (
                      <Check
                        className="absolute size-3 text-white"
                        strokeWidth={3}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={closeNewFolder}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
            className="gap-1.5"
          >
            {submitting && (
              <Loader2 className="size-[14px] animate-spin" strokeWidth={1.8} />
            )}
            Create folder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
