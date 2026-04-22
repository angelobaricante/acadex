import { useNavigate } from "react-router-dom";
import {
  FileIcon,
  FileImage,
  FileText,
  FileVideo,
  Folder as FolderIcon,
  Presentation,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { formatBytes, formatDate } from "@/lib/format";
import type { ArchivedFile, FileKind, Folder } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useShellSearch } from "@/components/layout/AppShell";
import SavingsBadge from "./SavingsBadge";
import FileActionsMenu from "./FileActionsMenu";

interface FileRowProps {
  file: ArchivedFile;
  folderTrail?: Folder[];
  folderById?: Map<string, Folder> | null;
  selected?: boolean;
  onSelectChange?: (checked: boolean, mode?: "replace" | "range" | "toggle") => void;
  onOpenFile?: (file: ArchivedFile) => void;
}

function fileTypeConfig(kind: FileKind): { Icon: LucideIcon, color: string, bg: string } {
  switch (kind) {
    case "pdf":
      return { Icon: FileText, color: "text-red-500", bg: "bg-red-50/80" };
    case "docx":
      return { Icon: FileText, color: "text-blue-500", bg: "bg-blue-50/80" };
    case "pptx":
      return { Icon: Presentation, color: "text-orange-500", bg: "bg-orange-50/80" };
    case "image":
      return { Icon: FileImage, color: "text-emerald-500", bg: "bg-emerald-50/80" };
    case "video":
      return { Icon: FileVideo, color: "text-purple-500", bg: "bg-purple-50/80" };
    default:
      return { Icon: FileIcon, color: "text-slate-500", bg: "bg-slate-50/80" };
  }
}

export default function FileRow({ file, folderTrail, folderById, selected, onSelectChange, onOpenFile }: FileRowProps) {
  const navigate = useNavigate();
  const { setSearch } = useShellSearch();
  const config = fileTypeConfig(file.kind);
  const Icon = config.Icon;
  const visibleTags = file.tags.slice(0, 2);
  const overflow = file.tags.length - visibleTags.length;

  const locationFolder = file.folderId ? folderById?.get(file.folderId) ?? null : null;
  const locationName = locationFolder?.name ?? "My Archive";

  const handleLocationClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate("/", { state: { folderTrail: locationFolder ? [locationFolder] : [] } });
  };

  const fileNameWithoutExt = file.name.includes('.') ? file.name.replace(/\.[^/.]+$/, "") : file.name;
  const extension = file.name.includes('.') ? file.name.split('.').pop()?.toUpperCase() : "";

  const handleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const shiftKey = "shiftKey" in e ? e.shiftKey : false;
    const metaKey = "metaKey" in e ? e.metaKey || e.ctrlKey : false;
    if (shiftKey) {
      onSelectChange?.(!selected, "range");
      return;
    }
    if (metaKey) {
      onSelectChange?.(!selected, "toggle");
      return;
    }
    onSelectChange?.(!selected, "replace");
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onOpenFile) {
      onOpenFile(file);
      return;
    }
    navigate(`/file/${file.id}`, { state: { folderTrail: folderTrail ?? [] } });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      if (onOpenFile) {
        onOpenFile(file);
        return;
      }
      navigate(`/file/${file.id}`, { state: { folderTrail: folderTrail ?? [] } });
      return;
    }
    if (e.key === " ") {
      handleClick(e);
    }
  };

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSearch(tag);
  };

  return (
    <div
      className="group/file-row relative flex items-center"
      data-select-id={file.id}
      data-select-type="file"
    >
      <div
        className={cn(
          "absolute left-3.5 z-10 transition-opacity duration-150",
          selected ? "opacity-100" : "opacity-0 group-hover/file-row:opacity-100"
        )}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={selected}
          onCheckedChange={(checked) => onSelectChange?.(checked === true, "toggle")}
          className="border-primary/30 bg-white/60 shadow-sm data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-white"
        />
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        data-slot="file-row"
        className={cn(
          "grid flex-1 items-center gap-4 rounded-lg border py-2.5 pr-12 pl-[42px] select-none",
          "grid-cols-[24px_minmax(0,1fr)_auto_120px_96px_96px]",
          "transition-colors duration-150",
          selected ? "border-primary/40 bg-primary/[0.02]" : "border-transparent hover:border-border/80 hover:bg-white",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        )}
      >
      <Icon
        aria-hidden="true"
        strokeWidth={1.8}
        className={cn("size-5", config.color)}
      />

      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-[13.5px] font-medium text-foreground">
          {fileNameWithoutExt}
        </span>
        {extension && (
          <Badge variant="outline" className={cn("h-4 shrink-0 rounded-full px-1.5 text-[9px] font-bold uppercase tracking-wider border-transparent mix-blend-multiply", config.bg, config.color)}>
            {extension}
          </Badge>
        )}
        {visibleTags.length > 0 && (
          <span className="hidden min-w-0 items-center gap-1 sm:inline-flex">
            {visibleTags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                onClick={(e) => handleTagClick(e, tag)}
                className="h-5 shrink-0 cursor-pointer rounded-full px-1.5 text-[11px] font-normal text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
              >
                {tag}
              </Badge>
            ))}
            {overflow > 0 && (
              <span className="shrink-0 text-[11px] font-medium text-muted-foreground/80 tabular-nums">
                +{overflow}
              </span>
            )}
          </span>
        )}
      </div>

      <SavingsBadge ratio={file.compressionRatio} />

      <button
        type="button"
        onClick={handleLocationClick}
        onMouseDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        className="flex min-w-0 items-center gap-1.5 rounded-md px-1.5 -mx-1.5 py-0.5 text-left text-[12.5px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <FolderIcon
          aria-hidden="true"
          strokeWidth={1.8}
          className="size-3.5 shrink-0 text-muted-foreground/70"
        />
        <span className="truncate">{locationName}</span>
      </button>

      <span className="text-right text-[12.5px] text-foreground tabular-nums">
        {formatBytes(file.storedBytes)}
      </span>

      <span className="text-right text-[12.5px] text-muted-foreground tabular-nums">
        {formatDate(file.createdAt)}
      </span>
      </div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        <FileActionsMenu file={file} variant="row" folderTrail={folderTrail} onOpenFile={onOpenFile} />
      </div>
    </div>
  );
}
