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

interface FileCardProps {
  file: ArchivedFile;
  selected?: boolean;
  onSelectChange?: (checked: boolean) => void;
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

export default function FileCard({ file, selected, onSelectChange }: FileCardProps) {
  const navigate = useNavigate();
  const { setSearch } = useShellSearch();
  const config = fileTypeConfig(file.kind);
  const Icon = config.Icon;
  const visibleTags = file.tags.slice(0, 1);
  const overflow = file.tags.length - visibleTags.length;

  const fileNameWithoutExt = file.name.includes('.') ? file.name.replace(/\.[^/.]+$/, "") : file.name;
  const extension = file.name.includes('.') ? file.name.split('.').pop()?.toUpperCase() : "";

  const handleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selected) {
      onSelectChange?.(true);
    } else {
      navigate(`/file/${file.id}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      handleClick(e);
    }
  };

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSearch(tag);
  };

  return (
    <div className="group/file-card relative h-full">
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        data-slot="file-card"
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-xl border bg-card",
          "shadow-[0_1px_0_rgba(16,24,40,0.02),0_1px_3px_rgba(16,24,40,0.04)]",
          "transition-[border-color,background-color] duration-200 ease-out",
          selected ? "border-primary/40 bg-primary/[0.02]" : "border-border/70 hover:border-primary/20",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        )}
      >
        {/* Top hairline — tints primary on hover */}
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-x-0 top-0 h-px transition-colors duration-200",
            selected ? "bg-primary/40" : "bg-border/80 group-hover/file-card:bg-primary/40"
          )}
        />

      {/* Thumbnail: soft radial wash + faint grid texture */}
      <div
        aria-hidden="true"
        className={cn(
          "relative flex h-[104px] items-center justify-center overflow-hidden",
          "bg-[radial-gradient(ellipse_at_center,hsl(48_25%_98%)_0%,hsl(210_17%_96%)_100%)]"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 opacity-[0.55]",
            "[background-image:linear-gradient(to_right,hsl(214_15%_91%/0.45)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_15%_91%/0.45)_1px,transparent_1px)]",
            "[background-size:16px_16px]"
          )}
        />
        <div className={cn(
          "relative flex size-11 items-center justify-center rounded-lg shadow-[0_1px_0_rgba(16,24,40,0.02),0_1px_2px_rgba(16,24,40,0.04)] ring-1 ring-border/70 transition-colors duration-200",
          config.bg,
          config.color
        )}>
          <Icon className="size-[20px]" strokeWidth={1.8} />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2.5 p-3">
        <div className="flex items-start justify-between gap-1.5 min-h-[2.55em]">
          <p className="line-clamp-2 text-[14px] font-medium leading-snug text-foreground">
            {fileNameWithoutExt}
          </p>
          {extension && (
            <Badge variant="outline" className={cn("mt-0.5 h-[18px] shrink-0 rounded-full px-1.5 text-[9.5px] font-bold uppercase tracking-wider border-transparent mix-blend-multiply", config.bg, config.color)}>
              {extension}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-[11.5px] text-muted-foreground tabular-nums">
          <span>{formatBytes(file.storedBytes)}</span>
          <span>{formatDate(file.createdAt)}</span>
        </div>

        <div className="mt-auto flex min-w-0 flex-nowrap items-center gap-1.5 overflow-hidden pt-0.5">
          <SavingsBadge ratio={file.compressionRatio} className="shrink-0" />
          {visibleTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              onClick={(e) => handleTagClick(e, tag)}
              className="h-5 min-w-0 max-w-[88px] cursor-pointer rounded-full truncate px-1.5 text-[11px] font-normal text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            >
              {tag}
            </Badge>
          ))}
          {overflow > 0 && (
            <span className="shrink-0 text-[11px] font-medium text-muted-foreground/80 tabular-nums">
              +{overflow}
            </span>
          )}
        </div>
      </div>
      </div>
      <FileActionsMenu file={file} variant="card" />

      <div 
        className={cn(
          "absolute left-2.5 top-2.5 z-10 transition-opacity duration-200",
          selected ? "opacity-100" : "opacity-0 group-hover/file-card:opacity-100"
        )}
      >
        <Checkbox 
          checked={selected}
          onCheckedChange={(checked) => onSelectChange?.(checked === true)}
          className="border-primary/30 bg-white/60 shadow-sm backdrop-blur-md data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-white"
        />
      </div>
    </div>
  );
}
