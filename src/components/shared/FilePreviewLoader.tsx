import { FileText, ImageIcon, Film, Presentation, FileArchive } from "lucide-react";
import type { FileKind } from "@/lib/types";

interface FilePreviewLoaderProps {
  kind: FileKind;
  fileName: string;
  exiting?: boolean;
}

function iconFor(kind: FileKind) {
  switch (kind) {
    case "image":
      return ImageIcon;
    case "video":
      return Film;
    case "pptx":
      return Presentation;
    case "docx":
    case "pdf":
      return FileText;
    default:
      return FileArchive;
  }
}

export default function FilePreviewLoader({ kind, fileName, exiting = false }: FilePreviewLoaderProps) {
  const Icon = iconFor(kind);

  return (
    <div
      className={`flex h-full w-full items-center justify-center px-6 ${exiting ? "preview-loader-exit" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="relative grid size-[88px] place-items-center">
        <div
          className="preview-loader-halo absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, hsl(var(--primary) / 0.22), hsl(var(--primary) / 0.04) 65%, transparent 72%)",
            filter: "blur(0.5px)",
          }}
        />

        <div className="absolute inset-[6px] rounded-full border border-border/70 bg-background/85 shadow-[0_10px_40px_-20px_hsl(var(--primary)/0.6)] backdrop-blur-sm" />

        <svg
          className="preview-loader-arc absolute inset-0"
          viewBox="0 0 88 88"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="arc-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              <stop offset="55%" stopColor="hsl(var(--primary))" stopOpacity="0.55" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="1" />
            </linearGradient>
          </defs>
          <circle
            cx="44"
            cy="44"
            r="39"
            fill="none"
            stroke="url(#arc-grad)"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeDasharray="120 245"
          />
        </svg>

        <Icon
          className="preview-loader-icon relative size-5 text-foreground/80"
          strokeWidth={1.6}
        />
      </div>

      <span className="sr-only">Loading preview of {fileName}</span>
    </div>
  );
}
