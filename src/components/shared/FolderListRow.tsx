import { Checkbox } from "@/components/ui/checkbox";
import FolderActionsMenu from "@/components/shared/FolderActionsMenu";
import { Folder as FolderIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import type { Folder } from "@/lib/types";

const FOLDER_TINT = {
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
} as const;

export default function FolderListRow({
  folder,
  selected,
  count,
  onSelect,
  onOpen,
}: {
  folder: Folder;
  selected: boolean;
  count: number;
  onSelect: (checked: boolean, shiftKey?: boolean) => void;
  onOpen: () => void;
}) {
  const tint = FOLDER_TINT[folder.color];

  return (
    <div className="group/folder-row relative flex items-center">
      <div
        className={cn(
          "absolute left-3.5 z-10 transition-opacity duration-150",
          selected ? "opacity-100" : "opacity-0 group-hover/folder-row:opacity-100"
        )}
      >
        <Checkbox
          checked={selected}
          onCheckedChange={(checked) => onSelect(checked === true)}
          className="border-primary/30 bg-white/60 shadow-sm data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-white"
        />
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.shiftKey) {
            onSelect(!selected, true);
            return;
          }
          if (!selected) onSelect(true, false);
        }}
        onDoubleClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onOpen();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            onOpen();
            return;
          }
          if (e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            if (e.shiftKey) {
              onSelect(!selected, true);
              return;
            }
            if (!selected) onSelect(true, false);
          }
        }}
        className={cn(
          "grid flex-1 items-center gap-4 rounded-lg border py-2.5 pr-12 pl-[42px]",
          "grid-cols-[24px_minmax(0,1fr)_96px_96px]",
          "transition-colors duration-150",
          selected
            ? "border-primary/40 bg-primary/[0.02]"
            : "border-transparent hover:border-border/80 hover:bg-white",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        )}
      >
        <span className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-md ring-1 transition-colors duration-200",
          tint.bg,
          tint.ring,
          tint.text
        )}>
          <FolderIcon className="size-[14px]" strokeWidth={1.8} />
        </span>

        <div className="min-w-0">
          <span className="truncate text-[13.5px] font-medium text-foreground">
            {folder.name}
          </span>
        </div>

        <span className="text-right text-[12.5px] text-foreground tabular-nums">
          {count} {count === 1 ? "file" : "files"}
        </span>

        <span className="text-right text-[12.5px] text-muted-foreground tabular-nums">
          {formatDate(folder.createdAt)}
        </span>
      </div>

      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        <FolderActionsMenu
          folder={folder}
          onOpen={onOpen}
          variant="row"
        />
      </div>
    </div>
  );
}
