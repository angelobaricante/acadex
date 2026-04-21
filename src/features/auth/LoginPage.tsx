import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Shield, User as UserIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockSignIn } from "@/lib/api";
import { useSessionStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RoleOption {
  value: Role;
  label: string;
  hint: string;
  Icon: typeof UserIcon;
}

const ROLE_OPTIONS: RoleOption[] = [
  { value: "student", label: "Student", hint: "Maria Santos", Icon: UserIcon },
  { value: "faculty", label: "Faculty", hint: "Prof. Juan Cruz", Icon: GraduationCap },
  { value: "admin", label: "Admin", hint: "Ana Reyes", Icon: Shield },
];

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

  async function handleSignIn() {
    if (loading) return;
    setLoading(true);
    try {
      const user = await mockSignIn(role);
      setUser(user);
      navigate("/", { replace: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-full overflow-hidden bg-[hsl(48_25%_98%)]">
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

      <main className="relative mx-auto flex min-h-screen w-full max-w-[440px] flex-col justify-center px-6 py-16">
        {/* Wordmark */}
        <div className="mb-10 flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-[7px] bg-primary text-primary-foreground shadow-sm">
            <span className="text-[15px] font-semibold leading-none tracking-tight">A</span>
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-foreground">
            AcaDex
          </span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border/80 bg-card p-7 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-12px_rgba(16,24,40,0.08)]">
          <div className="mb-6 space-y-1.5">
            <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-foreground">
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
            className="group h-11 w-full justify-center gap-2.5 rounded-lg border-border/80 bg-white text-[13.5px] font-medium text-foreground shadow-sm transition-all hover:-translate-y-px hover:border-border hover:bg-white hover:shadow-md disabled:opacity-70"
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
              className="grid grid-cols-3 gap-1 rounded-lg border border-border/80 bg-muted/60 p-1"
            >
              {ROLE_OPTIONS.map(({ value, label, Icon }) => {
                const selected = role === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={loading}
                    onClick={() => setRole(value)}
                    className={cn(
                      "group/role flex h-8 items-center justify-center gap-1.5 rounded-md text-[12.5px] font-medium outline-none transition-all",
                      "focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60",
                      selected
                        ? "bg-white text-foreground shadow-sm ring-1 ring-border/80"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-3.5 transition-colors",
                        selected ? "text-primary" : "text-muted-foreground/80"
                      )}
                    />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="mt-5 text-[11.5px] leading-relaxed text-muted-foreground">
            Demo mode. Google sign-in is simulated — the role above picks which
            fake user you sign in as.
          </p>
        </div>

        {/* Sustainability stat row */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11.5px] text-muted-foreground">
          <StatPill label="avg reduction" value="82%" />
          <Dot />
          <StatPill label="files archived" value="520+" />
          <Dot />
          <StatPill label="CO₂ saved" value="3.2kg" />
        </div>
      </main>
    </div>
  );
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

function Dot() {
  return <span aria-hidden="true" className="size-1 rounded-full bg-border" />;
}
