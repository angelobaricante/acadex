import { Leaf } from "lucide-react";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

interface SavingsBadgeProps {
  ratio: number;
  className?: string;
}

/**
 * Sustainability cue — primary-tinted outline pill. Kept compact so it can
 * sit next to tag chips without dominating the row.
 */
export default function SavingsBadge({ ratio, className }: SavingsBadgeProps) {
  return (
    <span
      data-slot="savings-badge"
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-full border border-primary/20 bg-primary/[0.06] px-1.5 text-[11px] font-medium leading-none text-primary tabular-nums",
        className
      )}
    >
      <Leaf aria-hidden="true" className="size-[11px]" />
      <span>
        {formatPercent(ratio)}
        <span className="ml-0.5 font-normal text-primary/80">smaller</span>
      </span>
    </span>
  );
}
