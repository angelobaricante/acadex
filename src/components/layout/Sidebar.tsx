import { NavLink } from "react-router-dom";
import { LayoutGrid, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import AcaDexLogo from "@/components/shared/AcaDexLogo";

interface NavItem {
  to: string;
  label: string;
  Icon: typeof LayoutGrid;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Archive", Icon: LayoutGrid, end: true },
  { to: "/impact", label: "Impact", Icon: Leaf },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border/70 bg-[hsl(48_25%_98%)] md:flex">
      {/* Wordmark — matches login */}
      <div className="flex h-14 items-center gap-2.5 px-4">
        <div className="flex size-7 items-center justify-center rounded-[6px] bg-primary text-primary-foreground shadow-sm">
          <AcaDexLogo size="size-[15px]" />
        </div>
        <span className="text-[14px] font-semibold tracking-tight text-foreground">
          AcaDex
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col px-2 pt-2">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ to, label, Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "group relative flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] transition-colors duration-150",
                    isActive
                      ? "bg-primary/8 font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Leading accent bar on active */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r-full bg-primary transition-opacity duration-200",
                        isActive ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <Icon
                      className={cn(
                        "size-[15px] transition-colors",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground/80 group-hover:text-foreground"
                      )}
                    />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Footer mark */}
        <div className="mt-auto px-2.5 pb-4 pt-6">
          <span className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground/70">
            BSU · 2026
          </span>
        </div>
      </nav>
    </aside>
  );
}
