import { useNavigate } from "react-router-dom";
import {
  Download,
  Edit2,
  ExternalLink,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteFolder } from "@/lib/api";
import { useUIStore } from "@/lib/store";
import type { Folder } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FolderActionsMenuProps {
  folder: Folder;
  onOpen: () => void;
}

export default function FolderActionsMenu({ folder, onOpen }: FolderActionsMenuProps) {
  const bumpFoldersVersion = useUIStore((s) => s.bumpFoldersVersion);

  async function handleCopyLink() {
    toast.success("Folder link copied");
  }

  async function handleDelete() {
    try {
      await deleteFolder(folder.id);
      toast.success("Folder deleted");
      bumpFoldersVersion();
    } catch {
      toast.error("Couldn't delete folder");
    }
  }

  const stopProp = {
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
    onMouseDown: (e: React.MouseEvent) => e.preventDefault(),
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Folder actions"
          className="ml-auto size-7 rounded-md text-muted-foreground/70 opacity-0 transition-all duration-150 hover:bg-muted hover:text-foreground group-hover/folder-tile:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
          {...stopProp}
        >
          <MoreVertical className="size-[14px]" strokeWidth={1.8} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 p-1"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuItem
          onSelect={() => onOpen()}
          className="gap-2 px-2 py-1.5 text-[13px]"
        >
          <ExternalLink className="size-[14px] text-muted-foreground" strokeWidth={1.8} />
          <span>Open</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => toast.info("Rename coming soon")}
          className="gap-2 px-2 py-1.5 text-[13px]"
        >
          <Edit2 className="size-[14px] text-muted-foreground" strokeWidth={1.8} />
          <span>Rename</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => toast.info("Download coming soon")}
          className="gap-2 px-2 py-1.5 text-[13px]"
        >
          <Download className="size-[14px] text-muted-foreground" strokeWidth={1.8} />
          <span>Download</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => void handleCopyLink()}
          className="gap-2 px-2 py-1.5 text-[13px]"
        >
          <Link2 className="size-[14px] text-muted-foreground" strokeWidth={1.8} />
          <span>Share</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          onSelect={() => void handleDelete()}
          className="gap-2 px-2 py-1.5 text-[13px]"
        >
          <Trash2 className="size-[14px]" strokeWidth={1.8} />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
