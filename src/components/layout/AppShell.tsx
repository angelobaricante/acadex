import { createContext, useContext, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface ShellSearchContextValue {
  search: string;
  setSearch: (v: string) => void;
}

const ShellSearchContext = createContext<ShellSearchContextValue | null>(null);

export function useShellSearch(): ShellSearchContextValue {
  const ctx = useContext(ShellSearchContext);
  if (!ctx) {
    // Safe fallback: allows pages to be rendered outside AppShell (e.g. tests)
    // without blowing up. In normal app flow, AppShell always provides it.
    return { search: "", setSearch: () => {} };
  }
  return ctx;
}

export default function AppShell() {
  const [search, setSearch] = useState("");
  const value = useMemo(() => ({ search, setSearch }), [search]);

  return (
    <ShellSearchContext.Provider value={value}>
      <div className="flex h-full min-h-0 w-full bg-[hsl(48_25%_98%)]">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="min-h-0 flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </ShellSearchContext.Provider>
  );
}
