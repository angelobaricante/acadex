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

interface FileRowProps {
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

export default function FileRow({ file }: FileRowProps) {
  const Icon = iconFor(file.kind);
  const visibleTags = file.tags.slice(0, 2);
  const overflow = file.tags.length - visibleTags.length;

  return (
    <div className="group/file-row relative">
      <Link
      to={`/file/${file.id}`}
      data-slot="file-row"
      className={cn(
        "grid items-center gap-4 rounded-lg border border-transparent py-2.5 pl-3 pr-12",
        "grid-cols-[24px_minmax(0,1fr)_auto_96px_96px]",
        "transition-colors duration-150",
        "hover:border-border/80 hover:bg-white",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      )}
    >
      <Icon
        aria-hidden="true"
        strokeWidth={1.6}
        className="size-6 text-muted-foreground/80 transition-colors duration-150 group-hover/file-row:text-primary"
      />

      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-[13.5px] font-medium text-foreground">
          {file.name}
        </span>
        {visibleTags.length > 0 && (
          <span className="hidden min-w-0 items-center gap-1 sm:inline-flex">
            {visibleTags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="h-5 shrink-0 px-1.5 text-[11px] font-normal text-muted-foreground"
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
      </Link>
      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        <FileActionsMenu file={file} variant="row" />
      </div>
    </div>
  );
}
