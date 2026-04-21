import { Folder as FolderIcon } from "lucide-react";
import type { Folder, FolderColor } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FolderTileProps {
  folder: Folder;
  fileCount: number;
  onClick: () => void;
}

const FOLDER_TINT: Record<
  FolderColor,
  { text: string; bg: string; ring: string }
> = {
  green: {
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    ring: "ring-emerald-200/70",
  },
  amber: {
    text: "text-amber-700",
    bg: "bg-amber-50",
    ring: "ring-amber-200/70",
  },
  blue: {
    text: "text-sky-700",
    bg: "bg-sky-50",
    ring: "ring-sky-200/70",
  },
  violet: {
    text: "text-violet-700",
    bg: "bg-violet-50",
    ring: "ring-violet-200/70",
  },
  neutral: {
    text: "text-muted-foreground",
    bg: "bg-muted/60",
    ring: "ring-border",
  },
};

export default function FolderTile({
  folder,
  fileCount,
  onClick,
}: FolderTileProps) {
  const tint = FOLDER_TINT[folder.color];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group/folder-tile flex h-[60px] w-[180px] shrink-0 items-center gap-2.5 rounded-xl border border-border/70 bg-card px-2.5 text-left",
        "shadow-[0_1px_0_rgba(16,24,40,0.02),0_1px_3px_rgba(16,24,40,0.04)]",
        "transition-[transform,box-shadow,border-color] duration-200 ease-out",
        "hover:-translate-y-px hover:border-primary/30",
        "hover:shadow-[0_1px_0_rgba(16,24,40,0.03),0_8px_20px_-8px_rgba(16,24,40,0.10)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 transition-colors duration-200",
          tint.bg,
          tint.ring,
          tint.text
        )}
      >
        <FolderIcon className="size-[15px]" strokeWidth={1.8} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[13.5px] font-medium leading-tight text-foreground">
          {folder.name}
        </span>
        <span className="mt-0.5 text-[11.5px] text-muted-foreground tabular-nums">
          {fileCount} {fileCount === 1 ? "file" : "files"}
        </span>
      </span>
    </button>
  );
}
