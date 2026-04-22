import { useNavigate } from "react-router-dom";
import {
  FileIcon,
  FileImage,
  FileText,
  FileVideo,
  Presentation,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { formatBytes, formatDate } from "@/lib/format";
import type { ArchivedFile, FileKind } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useShellSearch } from "@/components/layout/AppShell";
import SavingsBadge from "./SavingsBadge";
import FileActionsMenu from "./FileActionsMenu";

interface FileRowProps {
  file: ArchivedFile;
  folderTrail?: Folder[];
  selected?: boolean;
  onSelectChange?: (checked: boolean, shiftKey?: boolean) => void;
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

export default function FileRow({ file, folderTrail, selected, onSelectChange }: FileRowProps) {
  const navigate = useNavigate();
  const { setSearch } = useShellSearch();
  const config = fileTypeConfig(file.kind);
  const Icon = config.Icon;
  const visibleTags = file.tags.slice(0, 2);
  const overflow = file.tags.length - visibleTags.length;

  const fileNameWithoutExt = file.name.includes('.') ? file.name.replace(/\.[^/.]+$/, "") : file.name;
  const extension = file.name.includes('.') ? file.name.split('.').pop()?.toUpperCase() : "";

  const handleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const shiftKey = "shiftKey" in e ? e.shiftKey : false;
    if (shiftKey) {
      onSelectChange?.(!selected, true);
      return;
    }
    if (!selected) onSelectChange?.(true, false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/file/${file.id}`, { state: { folderTrail: folderTrail ?? [] } });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
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
    <div className="group/file-row relative flex items-center">
      <div 
        className={cn(
          "absolute left-3.5 z-10 transition-opacity duration-150",
          selected ? "opacity-100" : "opacity-0 group-hover/file-row:opacity-100"
        )}
      >
        <Checkbox 
          checked={selected}
          onCheckedChange={(checked) => onSelectChange?.(checked === true)}
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
          "grid flex-1 items-center gap-4 rounded-lg border py-2.5 pr-12 pl-[42px]",
          "grid-cols-[24px_minmax(0,1fr)_auto_96px_96px]",
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

      <span className="text-right text-[12.5px] text-foreground tabular-nums">
        {formatBytes(file.storedBytes)}
      </span>

      <span className="text-right text-[12.5px] text-muted-foreground tabular-nums">
        {formatDate(file.createdAt)}
      </span>
      </div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        <FileActionsMenu file={file} variant="row" folderTrail={folderTrail} />
      </div>
    </div>
  );
}
