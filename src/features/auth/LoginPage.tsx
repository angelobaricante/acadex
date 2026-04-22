import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockSignIn } from "@/lib/api";
import { useSessionStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import AcaDexLogo from "@/components/shared/AcaDexLogo";

interface RoleOption {
  value: Role;
  label: string;
  hint: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  { value: "student", label: "Student", hint: "Maria Santos" },
  { value: "faculty", label: "Faculty", hint: "Prof. Juan Cruz" },
  { value: "admin", label: "Admin", hint: "Ana Reyes" },
];

function StudentIcon({ selected }: { selected: boolean }) {
  return selected ? (
    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true" fill="currentColor">
      <circle cx="8" cy="5" r="3" />
      <path d="M2 15C2 11.686 4.686 9 8 9s6 2.686 6 6H2z" />
    </svg>
  ) : (
    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <circle cx="8" cy="5" r="3" />
      <path d="M2 15C2 11.686 4.686 9 8 9s6 2.686 6 6" />
    </svg>
  );
}

function FacultyIcon({ selected }: { selected: boolean }) {
  return selected ? (
    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true" fill="currentColor">
      <path d="M8 1.5L1 5.5l7 4 7-4-7-4z" />
      <path d="M3.5 8V12c0 .8 1.8 2.5 4.5 2.5S12.5 12.8 12.5 12V8L8 10.5 3.5 8z" />
    </svg>
  ) : (
    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5L1 5.5l7 4 7-4-7-4z" />
      <path d="M3.5 8V12c0 .8 1.8 2.5 4.5 2.5S12.5 12.8 12.5 12V8" />
      <line x1="13.5" y1="5.5" x2="13.5" y2="9.5" />
    </svg>
  );
}

function AdminIcon({ selected }: { selected: boolean }) {
  return selected ? (
    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true" fill="currentColor">
      <path d="M8 1L2 4v4c0 3.5 2.667 5.917 6 7 3.333-1.083 6-3.5 6-7V4L8 1z" />
    </svg>
  ) : (
    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1L2 4v4c0 3.5 2.667 5.917 6 7 3.333-1.083 6-3.5 6-7V4L8 1z" />
    </svg>
  );
}

const ROLE_ICONS: Record<Role, React.ComponentType<{ selected: boolean }>> = {
  student: StudentIcon,
  faculty: FacultyIcon,
  admin: AdminIcon,
};

function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true" className="size-[18px]">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.79 2.72v2.26h2.9c1.7-1.57 2.69-3.88 2.69-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.16.29-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.03l2.99-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const setUser = useSessionStore((s) => s.setUser);
  const [role, setRole] = useState<Role>("faculty");
  const [loading, setLoading] = useState(false);
  const roleIndex = ROLE_OPTIONS.findIndex((r) => r.value === role);

  async function handleSignIn() {
  if (loading) return;
  setLoading(true);
  try {
    const user = await mockSignIn(role);
    setUser(user);
    navigate("/", { replace: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign-in failed";
    if (message === "popup_closed") return;

    if (message.includes("Missing VITE_GOOGLE_CLIENT_ID")) {
      alert("Google sign-in is not configured. Set VITE_GOOGLE_CLIENT_ID in your env.");
      return;
    }

    alert(`Sign-in failed: ${message}`);
  } finally {
    setLoading(false); // ✅ moved here, stray `try` block removed
  }
}
  return (
    <div
      className="relative min-h-full overflow-hidden bg-[hsl(48_25%_98%)]"
    >
      {/* Ambient green radial glow, anchored top-left for asymmetry */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[20%] -top-[25%] h-[700px] w-[700px] rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, hsl(142 52% 34% / 0.18), hsl(142 52% 34% / 0.04) 55%, transparent 75%)",
        }}
      />
      {/* Faint dot grid for surface texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage:
            "radial-gradient(hsl(210 11% 15% / 0.08) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage:
            "radial-gradient(ellipse at 80% 100%, black 30%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 80% 100%, black 30%, transparent 75%)",
        }}
      />

      <main className="relative mx-auto flex min-h-screen w-full max-w-[440px] flex-col justify-center px-4 py-10 sm:px-6 sm:py-16">
        {/* Wordmark */}
        <div className="mb-8 flex items-center gap-2.5 sm:mb-10">
          <div className="flex size-8 items-center justify-center rounded-[7px] bg-primary text-primary-foreground shadow-sm">
            <AcaDexLogo />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-foreground">
            AcaDex
          </span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-12px_rgba(16,24,40,0.08)] sm:p-7">
          <div className="mb-6 space-y-1.5">
            <h1 className="text-[20px] font-semibold leading-tight tracking-tight text-foreground sm:text-[22px]">
              Welcome back
            </h1>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Every file compressed. Every byte saved.
            </p>
          </div>

          {/* Primary action */}
          <Button
            type="button"
            size="lg"
            variant="outline"
            disabled={loading}
            onClick={handleSignIn}
            className="group h-11 w-full justify-center gap-2.5 rounded-lg border-border/80 bg-white text-[13.5px] font-medium text-foreground shadow-sm transition-colors hover:border-border hover:bg-[#f8faff] disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
                <span>Signing you in…</span>
              </>
            ) : (
              <>
                <GoogleMark />
                <span>Sign in with Google</span>
              </>
            )}
          </Button>

          {/* Role selector — segmented control */}
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Demo role
              </span>
              <span className="text-[11px] text-muted-foreground/80">
                {ROLE_OPTIONS.find((r) => r.value === role)?.hint}
              </span>
            </div>
            <div
              role="radiogroup"
              aria-label="Demo role"
              className="relative grid grid-cols-3 gap-1 rounded-lg border border-border/80 bg-muted/60 p-1"
            >
              {/* Sliding selection pill */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-1 rounded-md bg-white shadow-sm ring-1 ring-border/80 transition-transform duration-200 ease-in-out"
                style={{
                  left: "4px",
                  width: "calc((100% - 16px) / 3)",
                  transform: `translateX(calc(${roleIndex} * (100% + 4px)))`,
                }}
              />
              {ROLE_OPTIONS.map(({ value, label }) => {
                const selected = role === value;
                const RIcon = ROLE_ICONS[value];
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={loading}
                    onClick={() => setRole(value)}
                    className={cn(
                      "relative flex h-8 items-center justify-center gap-1.5 rounded-md text-[12.5px] font-medium outline-none transition-colors duration-200",
                      "focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60",
                      selected
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <RIcon selected={selected} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sustainability stat row */}
        <div className="mt-6 flex items-center justify-center gap-4 sm:mt-8 sm:gap-8">
          <StatPill value="82%" label="Avg Reduction" />
          <div aria-hidden="true" className="h-7 w-px bg-border sm:h-9" />
          <StatPill value="520+" label="Files Archived" />
          <div aria-hidden="true" className="h-7 w-px bg-border sm:h-9" />
          <StatPill value="3.2kg" label="CO₂ Saved" />
        </div>
      </main>
    </div>
  );
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[22px] font-bold leading-none tabular-nums tracking-tight text-primary sm:text-[28px]">
        {value}
      </span>
      <span className="text-[11px] text-muted-foreground sm:text-[11.5px]">
        {label}
      </span>
    </div>
  );
}
