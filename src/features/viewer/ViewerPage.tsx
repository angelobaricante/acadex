import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, FileText, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteFile, getFile } from "@/lib/api";
import type { ArchivedFile } from "@/lib/types";
import { useSessionStore, useUIStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import SavingsBadge from "@/components/shared/SavingsBadge";
import { formatBytes, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import FilePreview from "./FilePreview";

type Status = "loading" | "ok" | "not_found";

export default function ViewerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useSessionStore((s) => s.user);
  const openShare = useUIStore((s) => s.openShare);

  const [status, setStatus] = useState<Status>("loading");
  const [file, setFile] = useState<ArchivedFile | null>(null);

  useEffect(() => {
    if (!id) {
      setStatus("not_found");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setFile(null);
    (async () => {
      try {
        const result = await getFile(id);
        if (cancelled) return;
        setFile(result);
        setStatus("ok");
      } catch {
        if (cancelled) return;
        setStatus("not_found");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (status === "loading") {
    return (
      <div className="grid h-full gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Skeleton className="h-[520px] w-full rounded-xl" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (status === "not_found" || !file) {
    return (
      <div className="flex h-full items-center justify-center p-6">
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
            <FileText className="size-5" strokeWidth={1.6} />
          </div>
          <h2 className="text-[15px] font-semibold tracking-tight">File not found</h2>
          <p className="text-[12.5px] text-muted-foreground">
            The file you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link to="/">
              <ArrowLeft className="size-3.5" />
              Back to library
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const canDelete = user ? user.id === file.ownerId || user.role === "admin" : false;

  async function handleDelete() {
    if (!file) return;
    if (!window.confirm(`Delete "${file.name}"? This cannot be undone.`)) return;
    try {
      await deleteFile(file.id);
      toast.success(`Deleted ${file.name}`);
      useUIStore.getState().bumpUploadsVersion();
      navigate("/");
    } catch {
      toast.error("Failed to delete file");
    }
  }

  return (
    <div className="grid h-full gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* Preview surface */}
      <div
        className={cn(
          "flex min-h-[480px] items-center justify-center overflow-hidden rounded-xl border border-border/70",
          "bg-[hsl(48_25%_98%)] p-6",
          "shadow-[0_1px_0_rgba(16,24,40,0.02),0_1px_3px_rgba(16,24,40,0.04)]"
        )}
      >
        <FilePreview file={file} />
      </div>

      {/* Right rail */}
      <aside className="flex flex-col gap-5">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
            <Link to="/">
              <ArrowLeft className="size-3.5" />
              Back
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-[18px] font-semibold leading-snug tracking-tight text-foreground">
            {file.name}
          </h1>
          <p className="text-[12.5px] text-muted-foreground tabular-nums">
            Added {formatDate(file.createdAt)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => openShare(file.id)}>
            <Share2 className="size-3.5" />
            Share
          </Button>
          <Button asChild size="sm" variant="outline">
            <a href={file.downloadUrl} download={file.name}>
              <Download className="size-3.5" />
              Download
            </a>
          </Button>
          {canDelete && (
            <Button size="sm" variant="outline" onClick={handleDelete}>
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          )}
        </div>

        <Separator />

        <dl className="flex flex-col gap-2.5 text-[12.5px]">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">Original size</dt>
            <dd className="font-medium tabular-nums">{formatBytes(file.originalBytes)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">Stored size</dt>
            <dd className="font-medium tabular-nums">{formatBytes(file.storedBytes)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">Savings</dt>
            <dd>
              <SavingsBadge ratio={file.compressionRatio} />
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">Type</dt>
            <dd className="font-medium uppercase tracking-wide tabular-nums">{file.kind}</dd>
          </div>
        </dl>

        <Separator />

        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Tags
          </span>
          {file.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {file.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="h-5 px-1.5 text-[11px] font-normal tracking-tight text-muted-foreground"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-muted-foreground/80">No tags</p>
          )}
        </div>
      </aside>
    </div>
  );
}
