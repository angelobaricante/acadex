import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[400px] rounded-2xl p-6"
      >
        <DialogHeader className="gap-3">
          {/* Danger icon */}
          <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
            <Trash2
              className="size-[18px] text-destructive"
              strokeWidth={1.8}
            />
          </div>
          <div className="flex flex-col gap-1">
            <DialogTitle className="text-[15px] font-semibold leading-snug">
              {title}
            </DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed">
              {description}
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="-mx-0 -mb-0 mt-2 flex-row justify-end gap-2 rounded-none border-none bg-transparent p-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-lg px-4 text-[13px] font-medium"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-9 rounded-lg bg-destructive px-4 text-[13px] font-medium text-destructive-foreground hover:bg-destructive/90"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
