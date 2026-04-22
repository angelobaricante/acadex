import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, LogOut, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSessionStore } from "@/lib/store";
import { mockSignIn, signOut } from "@/lib/api";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useShellSearch } from "./AppShell";

const ROLES: Array<{ value: Role; label: string }> = [
  { value: "student", label: "Student" },
  { value: "faculty", label: "Faculty" },
  { value: "admin", label: "Admin" },
];

function initialsOf(name: string): string {
  const parts = name
    .replace(/^(Prof\.|Dr\.|Mr\.|Ms\.|Mrs\.)\s+/i, "")
    .trim()
    .split(/\s+/);
  const letters = parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("");
  return letters.toUpperCase().slice(0, 2);
}

function roleLabel(role: Role): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function Topbar() {
  const navigate = useNavigate();
  const user = useSessionStore((s) => s.user);
  const setUser = useSessionStore((s) => s.setUser);
  const { search, setSearch } = useShellSearch();
  const [isFocused, setIsFocused] = useState(false);

  const showSuggestions = isFocused && !search;
  const suggestedTags = ["CS101", "Admin", "Project", "Thesis", "Textbook", "Lab", "Exam"];

  async function handleSwitchRole(role: Role) {
    if (user?.role === role) return;
    const next = await mockSignIn(role);
    setUser(next);
  }

  async function handleSignOut() {
    await signOut();
    setUser(null);
    toast("Signed out");
    navigate("/login", { replace: true });
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border/70 bg-white px-4 md:px-6">
      {/* Search */}
      <div className="relative w-full max-w-[480px]">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-2.5 top-1/2 size-[15px] -translate-y-1/2 text-muted-foreground/70"
        />
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder="Search files and tags…"
          className="h-9 rounded-lg border-border/80 bg-[hsl(48_25%_98%)] pl-8 pr-20 text-[13px] shadow-[inset_0_1px_0_rgba(16,24,40,0.02)] transition-colors focus-visible:bg-white [&::-webkit-search-cancel-button]:hidden"
        />
        {search && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setSearch("");
            }}
            className="absolute right-11 top-1/2 flex h-5 w-5 -translate-y-1/2 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-[13px]" strokeWidth={3} />
          </button>
        )}
        <kbd
          aria-hidden="true"
          className="pointer-events-none absolute right-2 top-1/2 hidden h-5 -translate-y-1/2 select-none items-center gap-0.5 rounded border border-border/80 bg-white px-1.5 font-sans text-[10.5px] font-medium text-muted-foreground sm:inline-flex"
        >
          <span className="text-[11px] leading-none">⌘</span>
          <span className="leading-none">K</span>
        </kbd>

        {showSuggestions && (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 rounded-xl border border-border/80 bg-white p-2 shadow-[0_8px_30px_rgb(0,0,0,0.08)] animate-in fade-in slide-in-from-top-1.5">
            <div className="px-2 pb-1.5 pt-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/80">
              Suggested Tags
            </div>
            <div className="flex flex-wrap gap-1.5 px-1 py-1">
              {suggestedTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSearch(tag);
                    setIsFocused(false);
                  }}
                  className="rounded-md bg-muted/60 px-2.5 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="h-9 gap-2 rounded-lg px-1.5 hover:bg-muted/70"
              >
                <Avatar size="sm">
                  <AvatarFallback className="bg-primary/10 text-[11px] font-medium text-primary">
                    {initialsOf(user.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground sm:inline">
                  {roleLabel(user.role)}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={6}
              className="w-64 p-1.5"
            >
              <div className="px-2 pb-2 pt-1.5">
                <div className="text-[13.5px] font-medium leading-tight text-foreground">
                  {user.name}
                </div>
                <div className="mt-0.5 text-[12px] leading-tight text-muted-foreground">
                  {user.email}
                </div>
              </div>
              <DropdownMenuSeparator />
              <div className="px-2 pb-1 pt-1.5">
                <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Switch demo role
                </span>
              </div>
              {ROLES.map(({ value, label }) => {
                const active = user.role === value;
                return (
                  <DropdownMenuItem
                    key={value}
                    onSelect={() => handleSwitchRole(value)}
                    className={cn(
                      "gap-2 px-2 py-1.5 text-[13px]",
                      active && "font-medium text-primary"
                    )}
                  >
                    <span className="flex-1">{label}</span>
                    {active && (
                      <Check className="size-[14px] text-primary" />
                    )}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={handleSignOut}
                className="gap-2 px-2 py-1.5 text-[13px]"
              >
                <LogOut className="size-[14px] text-muted-foreground" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
