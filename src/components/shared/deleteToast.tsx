import { Folder as FolderIcon, File as FileIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type DeleteToastKind = "file" | "folder" | "bulk";

export interface DeleteToastOptions {
  kind: DeleteToastKind;
  name?: string;
  count?: number;
  duration?: number;
}

function DeleteToastIcon({ kind }: { kind: DeleteToastKind }) {
  const Icon = kind === "folder" ? FolderIcon : kind === "bulk" ? Trash2 : FileIcon;
  return <Icon className="size-[18px]" strokeWidth={1.8} />;
}

export function showDeleteToast(opts: DeleteToastOptions) {
  const { kind, name, count, duration = 4200 } = opts;

  const title =
    kind === "bulk"
      ? `${count ?? 0} ${count === 1 ? "item" : "items"} deleted`
      : kind === "folder"
        ? "Folder deleted"
        : name ?? "File deleted";

  const description =
    kind === "bulk"
      ? "Selected files and folders were removed from the archive."
      : kind === "folder"
        ? name
          ? `"${name}" was permanently deleted.`
          : "The folder was permanently deleted."
        : name
          ? `"${name}" was permanently deleted.`
          : "The file was permanently deleted.";

  toast.custom(
    (id) => (
      <div
        className={cn(
          "flex w-[340px] items-start gap-3 rounded-xl border border-destructive/15 bg-white px-3.5 py-3",
          "shadow-[0_4px_24px_-4px_rgba(16,24,40,0.14),0_1px_0_rgba(16,24,40,0.02)]",
          "animate-in slide-in-from-bottom-3 fade-in duration-300"
        )}
      >
        <span
          className={cn(
            "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl",
            "bg-destructive/10 text-destructive ring-1 ring-destructive/20"
          )}
        >
          <DeleteToastIcon kind={kind} />
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-[13.5px] font-semibold leading-tight text-foreground">
            {title}
          </p>
          <p className="truncate text-[11.5px] leading-tight text-muted-foreground">
            {description}
          </p>
        </div>

        <button
          type="button"
          onClick={() => toast.dismiss(id)}
          aria-label="Dismiss"
          className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
        >
          ✕
        </button>
      </div>
    ),
    { duration }
  );
}
