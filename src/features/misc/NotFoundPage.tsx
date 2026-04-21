import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[hsl(48_25%_98%)]">
      {/* Ambient green radial glow, anchored bottom-right as a quiet counterpoint */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[30%] -right-[20%] h-[700px] w-[700px] rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, hsl(142 52% 34% / 0.14), hsl(142 52% 34% / 0.03) 55%, transparent 75%)",
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
            "radial-gradient(ellipse at 20% 0%, black 30%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 20% 0%, black 30%, transparent 75%)",
        }}
      />

      <main className="relative mx-auto flex min-h-screen w-full max-w-[520px] flex-col items-center justify-center px-6 py-16 text-center">
        {/* Wordmark */}
        <div className="mb-10 flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-[7px] bg-primary text-primary-foreground shadow-sm">
            <span className="text-[15px] font-semibold leading-none tracking-tight">
              A
            </span>
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-foreground">
            AcaDex
          </span>
        </div>

        {/* Eyebrow */}
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Error 404
        </span>

        {/* Headline */}
        <h1 className="mt-2 text-[34px] font-semibold leading-[1.1] tracking-tight text-foreground">
          We lost that page
        </h1>

        {/* Description */}
        <p className="mt-3 max-w-[360px] text-[13.5px] leading-relaxed text-muted-foreground">
          The page you're looking for may have moved or doesn't exist.
        </p>

        {/* Action */}
        <Button
          asChild
          variant="outline"
          size="sm"
          className="mt-8 h-9 rounded-lg border-border/80 bg-white px-4 text-[13px] font-medium shadow-sm hover:bg-white hover:shadow-md"
        >
          <Link to="/">Back to archive</Link>
        </Button>
      </main>
    </div>
  );
}
