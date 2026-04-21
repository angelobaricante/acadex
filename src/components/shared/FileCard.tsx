import { Link } from "react-router-dom";
import {
  FileIcon,
  FileImage,
  FileText,
  FileVideo,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatBytes, formatDate } from "@/lib/format";
import type { ArchivedFile, FileKind } from "@/lib/types";
import { cn } from "@/lib/utils";
import SavingsBadge from "./SavingsBadge";
import FileActionsMenu from "./FileActionsMenu";

interface FileCardProps {
  file: ArchivedFile;
}

function iconFor(kind: FileKind): LucideIcon {
  switch (kind) {
    case "pdf":
    case "docx":
    case "pptx":
      return FileText;
    case "image":
      return FileImage;
    case "video":
      return FileVideo;
    default:
      return FileIcon;
  }
}

export default function FileCard({ file }: FileCardProps) {
  const Icon = iconFor(file.kind);
  const visibleTags = file.tags.slice(0, 1);
  const overflow = file.tags.length - visibleTags.length;

  return (
    <div className="group/file-card relative h-full">
      <Link
      to={`/file/${file.id}`}
      data-slot="file-card"
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card",
        "shadow-[0_1px_0_rgba(16,24,40,0.02),0_1px_3px_rgba(16,24,40,0.04)]",
        "transition-[border-color] duration-200 ease-out",
        "hover:border-primary/20",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      )}
    >
      {/* Top hairline — tints primary on hover */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-border/80 transition-colors duration-200 group-hover/file-card:bg-primary/40"
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
        <div className="relative flex size-11 items-center justify-center rounded-lg bg-white/80 text-muted-foreground shadow-[0_1px_0_rgba(16,24,40,0.02),0_1px_2px_rgba(16,24,40,0.04)] ring-1 ring-border/70 transition-colors duration-200 group-hover/file-card:text-primary">
          <Icon className="size-[20px]" strokeWidth={1.6} />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2.5 p-3">
        <p className="line-clamp-2 min-h-[2.55em] text-[14px] font-medium leading-snug text-foreground">
          {file.name}
        </p>

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
              className="h-5 min-w-0 max-w-[88px] truncate px-1.5 text-[11px] font-normal text-muted-foreground"
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
      </Link>
      <FileActionsMenu file={file} variant="card" />
    </div>
  );
}
