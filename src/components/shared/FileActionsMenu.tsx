import { useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import { useNavigate } from "react-router-dom";
import {
  Check,
  ExternalLink,
  Folder as FolderIcon,
  FolderMinus,
  Link2,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  createShareLink,
  deleteFile,
  listFolders,
  moveFileToFolder,
} from "@/lib/api";
import { useUIStore } from "@/lib/store";
import type { ArchivedFile, Folder } from "@/lib/types";
import { cn } from "@/lib/utils";
import { showDeleteToast } from "./deleteToast";

interface FileActionsMenuProps {
  file: ArchivedFile;
  /** Visual variant for the trigger button. */
  variant?: "card" | "row";
  folderTrail?: Folder[];
  onOpenFile?: (file: ArchivedFile) => void;
}

export default function FileActionsMenu({ file, variant = "card", folderTrail, onOpenFile }: FileActionsMenuProps) {
  const navigate = useNavigate();
  const bumpFoldersVersion = useUIStore((s) => s.bumpFoldersVersion);
  const [folders, setFolders] = useState<Folder[] | null>(null);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function ensureFoldersLoaded() {
    if (folders !== null || loadingFolders) return;
    setLoadingFolders(true);
    try {
      const result = await listFolders();
      setFolders(result);
    } catch {
      setFolders([]);
    } finally {
      setLoadingFolders(false);
    }
  }

  function handleOpen() {
    if (onOpenFile) {
      onOpenFile(file);
      return;
    }
    navigate(`/file/${file.id}`, { state: { folderTrail: folderTrail ?? [] } });
  }

  async function handleCopyLink() {
    try {
      const link = await createShareLink(file.id, "view");
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      await navigator.clipboard.writeText(`${origin}/s/${link.id}`);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy link");
    }
  }

  async function handleMove(folderId: string | null, folderName: string | null) {
    try {
      await moveFileToFolder(file.id, folderId);
      toast.success(
        folderId
          ? `Moved to '${folderName}'`
          : "Removed from folder"
      );
      bumpFoldersVersion();
    } catch {
      toast.error("Couldn't move file");
    }
  }

  async function handleDelete() {
    try {
      await deleteFile(file.id);
      showDeleteToast({ kind: "file", name: file.name });
      bumpFoldersVersion();
    } catch {
      toast.error("Couldn't delete file");
    }
  }

  function requestDelete() {
    setConfirmOpen(true);
  }

  // Prevent clicks inside the menu trigger from bubbling to the parent Link.
  const stopLink = {
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
    onMouseDown: (e: React.MouseEvent) => e.preventDefault(),
  };

  const triggerClass =
    variant === "card"
      ? cn(
          "absolute top-2 right-2 z-10",
          "size-8 rounded-md bg-white/80 text-muted-foreground ring-1 ring-border/70 shadow-sm backdrop-blur-sm",
          "hover:bg-white hover:text-foreground",
          "opacity-0 group-hover/file-card:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100",
          "transition-opacity duration-150"
        )
      : cn(
          "size-8 rounded-md text-muted-foreground/70",
          "hover:bg-muted hover:text-foreground",
          "opacity-70 group-hover/file-row:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100",
          "transition-opacity duration-150"
        );

  return (<>
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) void ensureFoldersLoaded();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="File actions"
          className={triggerClass}
          {...stopLink}
        >
          <MoreVertical className="size-[14px]" strokeWidth={1.8} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-60 p-1"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuItem
          onSelect={() => handleOpen()}
          className="gap-2 px-2 py-1.5 text-[13px]"
        >
          <ExternalLink className="size-[14px] text-muted-foreground" strokeWidth={1.8} />
          <span>Open</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => void handleCopyLink()}
          className="gap-2 px-2 py-1.5 text-[13px]"
        >
          <Link2 className="size-[14px] text-muted-foreground" strokeWidth={1.8} />
          <span>Copy link</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2 px-2 py-1.5 text-[13px]">
            <FolderIcon className="size-[14px] text-muted-foreground" strokeWidth={1.8} />
            <span>Move to folder</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
          <DropdownMenuSubContent
            className="w-56 p-1"
            sideOffset={4}
            alignOffset={-4}
            collisionPadding={12}
            avoidCollisions>
            {file.folderId ? (
              <>
                <DropdownMenuItem
                  onSelect={() => void handleMove(null, null)}
                  className="gap-2 px-2 py-1.5 text-[13px]"
                >
                  <FolderMinus className="size-[14px] text-muted-foreground" strokeWidth={1.8} />
                  <span>Remove from folder</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            ) : null}
            {folders === null || loadingFolders ? (
              <div className="px-2 py-1.5 text-[12.5px] text-muted-foreground">
                Loading folders…
              </div>
            ) : folders.length === 0 ? (
              <div className="px-2 py-1.5 text-[12.5px] text-muted-foreground">
                No folders yet
              </div>
            ) : (
              folders.map((folder) => {
                const isCurrent = folder.id === file.folderId;
                return (
                  <DropdownMenuItem
                    key={folder.id}
                    disabled={isCurrent}
                    onSelect={() => void handleMove(folder.id, folder.name)}
                    className="gap-2 px-2 py-1.5 text-[13px]"
                  >
                    <FolderIcon className="size-[14px] text-muted-foreground" strokeWidth={1.8} />
                    <span className="truncate">{folder.name}</span>
                    {isCurrent && (
                      <Check className="ml-auto size-[13px] text-primary" strokeWidth={2} />
                    )}
                  </DropdownMenuItem>
                );
              })
            )}
          </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          onSelect={() => requestDelete()}
          className="gap-2 px-2 py-1.5 text-[13px]"
        >
          <Trash2 className="size-[14px]" strokeWidth={1.8} />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <ConfirmDialog
      open={confirmOpen}
      onOpenChange={setConfirmOpen}
      title="Delete file?"
      description={`"${file.name}" will be permanently deleted and cannot be recovered.`}
      confirmLabel="Delete file"
      onConfirm={() => void handleDelete()}
    />
  </>);
}
