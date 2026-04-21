import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
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
import { createFolder } from "@/lib/api";
import type { FolderColor } from "@/lib/types";
import { toast } from "sonner";

const COLOR_OPTIONS: Array<{ value: FolderColor; label: string; dot: string }> = [
  { value: "green", label: "Green", dot: "bg-emerald-500" },
  { value: "amber", label: "Amber", dot: "bg-amber-500" },
  { value: "blue", label: "Blue", dot: "bg-sky-500" },
  { value: "violet", label: "Violet", dot: "bg-violet-500" },
  { value: "neutral", label: "Neutral", dot: "bg-muted-foreground" },
];

export default function NewFolderDialog() {
  const open = useUIStore((s) => s.newFolderDialogOpen);
  const closeNewFolder = useUIStore((s) => s.closeNewFolder);
  const bumpFoldersVersion = useUIStore((s) => s.bumpFoldersVersion);

  const [name, setName] = useState("");
  const [color, setColor] = useState<FolderColor>("green");
  const [submitting, setSubmitting] = useState(false);

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
      await createFolder(trimmed, color);
      toast.success("Folder created", { description: trimmed });
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
