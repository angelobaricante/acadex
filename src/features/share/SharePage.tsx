import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertCircle, Download, GraduationCap } from "lucide-react";
import { getShareLink } from "@/lib/api";
import type { ArchivedFile, ShareLink } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import FilePreview from "@/features/viewer/FilePreview";
import SavingsBadge from "@/components/shared/SavingsBadge";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

type Status = "loading" | "ok" | "not_found";

interface ShareData {
  link: ShareLink;
  file: ArchivedFile;
}

function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border/70 bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-[6px] bg-primary text-primary-foreground shadow-sm">
            <span className="text-[13px] font-semibold leading-none tracking-tight">
              A
            </span>
          </div>
          <span className="text-[14px] font-semibold tracking-tight text-foreground">
            AcaDex
          </span>
        </Link>
        <span aria-hidden="true" className="h-4 w-px bg-border" />
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Shared file
        </span>
      </div>
      <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
        <Link to="/">
          <GraduationCap className="size-3.5" />
          Open AcaDex
        </Link>
      </Button>
    </header>
  );
}

function LoadingState() {
  return (
    <>
      {/* Metadata strip skeleton */}
      <div className="flex h-14 items-center justify-between gap-4 border-b border-border/70 bg-white px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <Skeleton className="h-8 w-28" />
      </div>
      {/* Preview skeleton */}
      <div className="flex-1 bg-[hsl(48_25%_98%)] p-6">
        <div className="mx-auto h-full w-full max-w-5xl">
          <Skeleton className="h-full min-h-[520px] w-full rounded-xl" />
        </div>
      </div>
    </>
  );
}

function NotFoundState() {
  return (
    <div className="flex flex-1 items-center justify-center bg-[hsl(48_25%_98%)] p-6">
      <div
        className={cn(
          "flex w-full max-w-sm flex-col items-center gap-3 rounded-xl border border-border/70 bg-card p-8 text-center",
          "shadow-[0_1px_0_rgba(16,24,40,0.02),0_1px_3px_rgba(16,24,40,0.04)]"
        )}
      >
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-lg bg-muted text-muted-foreground",
            "ring-1 ring-border/70"
          )}
        >
          <AlertCircle className="size-5" strokeWidth={1.6} />
        </div>
        <h2 className="text-[15px] font-semibold tracking-tight">Link not found</h2>
        <p className="text-[12.5px] text-muted-foreground">
          This share link may have been revoked.
        </p>
      </div>
    </div>
  );
}

function ViewOnlyChip() {
  return (
    <span className="inline-flex h-5 items-center rounded-full border border-border/70 bg-muted px-2 text-[11px] font-medium tracking-tight text-muted-foreground">
      View only
    </span>
  );
}

function OkState({ data }: { data: ShareData }) {
  const { link, file } = data;
  const canDownload = link.permission === "view_and_download";

  return (
    <>
      {/* Metadata strip */}
      <div className="flex h-14 items-center justify-between gap-4 border-b border-border/70 bg-white px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="truncate text-[13.5px] font-semibold tracking-tight text-foreground">
            {file.name}
          </h1>
          <span className="shrink-0 text-[12px] text-muted-foreground tabular-nums">
            {formatBytes(file.storedBytes)}
          </span>
          <SavingsBadge ratio={file.compressionRatio} className="shrink-0" />
          {!canDownload && <ViewOnlyChip />}
        </div>
        {canDownload && (
          <Button asChild size="sm">
            <a href={file.downloadUrl} download={file.name}>
              <Download className="size-3.5" />
              Download
            </a>
          </Button>
        )}
      </div>

      {/* Preview region */}
      <div className="flex-1 bg-[hsl(48_25%_98%)] p-6">
        <div
          className={cn(
            "mx-auto flex h-full min-h-[520px] w-full max-w-5xl items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-card p-6",
            "shadow-[0_1px_0_rgba(16,24,40,0.02),0_1px_3px_rgba(16,24,40,0.04)]"
          )}
        >
          <FilePreview file={file} />
        </div>
      </div>
    </>
  );
}

export default function SharePage() {
  const { shareId } = useParams<{ shareId: string }>();
  const [status, setStatus] = useState<Status>("loading");
  const [data, setData] = useState<ShareData | null>(null);

  useEffect(() => {
    if (!shareId) {
      setStatus("not_found");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setData(null);
    (async () => {
      try {
        const result = await getShareLink(shareId);
        if (cancelled) return;
        setData(result);
        setStatus("ok");
      } catch {
        if (cancelled) return;
        setStatus("not_found");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shareId]);

  return (
    <div className="flex min-h-screen flex-col bg-[hsl(48_25%_98%)]">
      <Header />
      {status === "loading" && <LoadingState />}
      {status === "not_found" && <NotFoundState />}
      {status === "ok" && data && <OkState data={data} />}
    </div>
  );
}
