import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Reusable empty-state container — dashed hairline, muted canvas, icon
 * resting in a circular chip. Works in both wide and narrow containers.
 */
export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/80 bg-[hsl(48_25%_98%)] px-6 py-12 text-center",
        className
      )}
    >
      {icon && (
        <div
          aria-hidden="true"
          className="flex size-10 items-center justify-center rounded-full bg-muted/70 text-muted-foreground [&>svg]:size-[18px]"
        >
          {icon}
        </div>
      )}
      <div className="flex max-w-sm flex-col gap-1">
        <p className="text-[14px] font-medium leading-tight text-foreground">
          {title}
        </p>
        {description && (
          <p className="text-[13px] leading-snug text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
