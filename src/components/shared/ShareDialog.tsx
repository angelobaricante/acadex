import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/store";
import type { SharePermission } from "@/lib/types";
import { toast } from "sonner";

const PERMISSION_OPTIONS: Array<{ value: SharePermission; label: string }> = [
  { value: "view", label: "View only" },
  { value: "view_and_download", label: "Allow download" },
];

export default function ShareDialog() {
  const shareDialog = useUIStore((s) => s.shareDialog);
  const closeShare = useUIStore((s) => s.closeShare);

  const [permission, setPermission] = useState<SharePermission>("view");
  const [generating, setGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  // Reset local state whenever the dialog opens or targets a new file.
  useEffect(() => {
    if (shareDialog.open) {
      setPermission("view");
      setShareUrl("");
      setCopied(false);
    }
  }, [shareDialog.open, shareDialog.fileId]);

  async function handleGenerate() {
    if (!shareDialog.fileId || generating) return;
    setGenerating(true);
    try {
      setShareUrl(`https://drive.google.com/file/d/${shareDialog.fileId}/view`);
    } catch {
      toast.error("Couldn't generate link", {
        description: "Please try again.",
      });
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied", {
        description: "Paste it into Google Classroom.",
      });
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy link");
    }
  }

  return (
    <Dialog
      open={shareDialog.open}
      onOpenChange={(o) => {
        if (!o) closeShare();
      }}
    >
      <DialogContent
        className={cn(
          "sm:max-w-[440px] gap-5 p-6",
          "shadow-[0_1px_0_rgba(16,24,40,0.02),0_20px_40px_-12px_rgba(16,24,40,0.18)]"
        )}
      >
        <DialogHeader className="gap-1.5">
          <DialogTitle className="text-[15px] font-semibold tracking-tight">
            Share file
          </DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground/90">
            Generate a link anyone can open in their browser — no download required.
          </DialogDescription>
        </DialogHeader>

        {/* Permission selector */}
        <div>
          <div className="mb-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Permission
            </span>
          </div>
          <div
            role="radiogroup"
            aria-label="Share permission"
            className="grid grid-cols-2 gap-1 rounded-lg border border-border/80 bg-muted/60 p-1"
          >
            {PERMISSION_OPTIONS.map(({ value, label }) => {
              const selected = permission === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={generating}
                  onClick={() => setPermission(value)}
                  className={cn(
                    "flex h-8 items-center justify-center rounded-md text-[12.5px] font-medium outline-none transition-all",
                    "focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60",
                    selected
                      ? "bg-white text-foreground shadow-sm ring-1 ring-border/80"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "transition-colors",
                      selected && "text-primary"
                    )}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary area */}
        {shareUrl ? (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-9 flex-1 items-center rounded-lg px-2.5",
                "bg-muted/60 ring-1 ring-inset ring-border/70",
                "shadow-[inset_0_1px_0_rgba(16,24,40,0.04)]"
              )}
            >
              <Input
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                className={cn(
                  "h-8 border-0 bg-transparent px-0 text-[12.5px] text-foreground shadow-none",
                  "focus-visible:border-0 focus-visible:ring-0"
                )}
              />
            </div>
            <Button
              variant="outline"
              onClick={handleCopy}
              className="h-9 gap-1.5 px-3"
            >
              <span className="relative inline-flex size-3.5 items-center justify-center">
                <Check
                  className={cn(
                    "absolute size-3.5 text-primary transition-opacity duration-150 ease-out",
                    copied ? "opacity-100" : "opacity-0"
                  )}
                  strokeWidth={2}
                />
                <Copy
                  className={cn(
                    "absolute size-3.5 transition-opacity duration-150 ease-out",
                    copied ? "opacity-0" : "opacity-100"
                  )}
                  strokeWidth={1.8}
                />
              </span>
              <span className="text-[12.5px] font-medium">
                {copied ? "Copied" : "Copy"}
              </span>
            </Button>
          </div>
        ) : (
          <Button
            className="h-10 w-full"
            onClick={handleGenerate}
            disabled={generating || !shareDialog.fileId}
          >
            {generating ? "Generating…" : "Generate link"}
          </Button>
        )}

        <div className="flex justify-end">
          <Button variant="ghost" onClick={closeShare}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
