import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ViewMode } from "@/features/dashboard/DashboardPage";

export default function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (view: ViewMode) => void }) {
  return (
    <div
      role="group"
      aria-label="View mode"
      className="ml-1 flex items-center gap-0.5 rounded-lg border border-border/70 bg-[hsl(48_25%_98%)] p-0.5"
    >
      <button
        type="button"
        aria-label="Grid view"
        aria-pressed={view === "grid"}
        onClick={() => onChange("grid")}
        className={cn(
          "flex size-7 items-center justify-center rounded-md transition-colors duration-150",
          view === "grid"
            ? "bg-white text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <LayoutGrid className="size-[14px]" strokeWidth={1.8} />
      </button>
      <button
        type="button"
        aria-label="List view"
        aria-pressed={view === "list"}
        onClick={() => onChange("list")}
        className={cn(
          "flex size-7 items-center justify-center rounded-md transition-colors duration-150",
          view === "list"
            ? "bg-white text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <List className="size-[14px]" strokeWidth={1.8} />
      </button>
    </div>
  );
}
