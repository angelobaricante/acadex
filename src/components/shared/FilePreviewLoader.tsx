import type { FileKind } from "@/lib/types";

interface FilePreviewLoaderProps {
  kind?: FileKind;
  fileName: string;
  exiting?: boolean;
}

const GREEN = "hsl(142 75% 68%)";
const GREEN_BRIGHT = "hsl(142 85% 78%)";

// Particle trajectories — each streams toward the chevron (0,0) from an offscreen point.
const PARTICLES: Array<{ fromX: number; fromY: number; delay: number; size: number }> = [
  { fromX: -38, fromY: -24, delay: 0.0, size: 2.2 },
  { fromX:  42, fromY: -30, delay: 0.25, size: 1.8 },
  { fromX: -46, fromY:  18, delay: 0.5, size: 2.0 },
  { fromX:  38, fromY:  22, delay: 0.75, size: 1.6 },
  { fromX: -20, fromY: -40, delay: 1.0, size: 1.4 },
  { fromX:  24, fromY:  36, delay: 1.25, size: 2.2 },
];

export default function FilePreviewLoader({ fileName, exiting = false }: FilePreviewLoaderProps) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center px-6 ${exiting ? "preview-loader-exit" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-5">
        <div className="relative grid size-[128px] place-items-center">
          {/* Streaming data particles */}
          <div className="absolute inset-0">
            {PARTICLES.map((p, i) => (
              <span
                key={i}
                className="preview-loader-particle absolute left-1/2 top-1/2 size-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  ["--from-x" as string]: `${p.fromX}px`,
                  ["--from-y" as string]: `${p.fromY}px`,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  background: GREEN_BRIGHT,
                  animationDelay: `${p.delay}s`,
                }}
              />
            ))}
          </div>

          {/* Orbital rings */}
          <svg
            viewBox="0 0 128 128"
            aria-hidden="true"
            className="absolute inset-0"
          >
            <defs>
              <linearGradient id="ring-outer" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%"  stopColor={GREEN}        stopOpacity="0" />
                <stop offset="55%" stopColor={GREEN}        stopOpacity="0.55" />
                <stop offset="100%" stopColor={GREEN_BRIGHT} stopOpacity="1" />
              </linearGradient>
              <linearGradient id="ring-inner" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor={GREEN}        stopOpacity="0" />
                <stop offset="70%" stopColor={GREEN}        stopOpacity="0.45" />
                <stop offset="100%" stopColor={GREEN_BRIGHT} stopOpacity="0.95" />
              </linearGradient>
            </defs>

            <g className="preview-loader-ring-outer">
              <circle
                cx="64" cy="64" r="60"
                fill="none"
                stroke="url(#ring-outer)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="160 220"
              />
              <circle cx="124" cy="64" r="2.4" fill={GREEN_BRIGHT}>
                <animate attributeName="r" values="2.4;3.6;2.4" dur="1.6s" repeatCount="indefinite" />
              </circle>
            </g>

            <g className="preview-loader-ring-inner">
              <circle
                cx="64" cy="64" r="48"
                fill="none"
                stroke="url(#ring-inner)"
                strokeWidth="1"
                strokeLinecap="round"
                strokeDasharray="40 260"
              />
              <circle cx="16" cy="64" r="1.8" fill={GREEN_BRIGHT} />
            </g>
          </svg>

          {/* Logo with sheen sweep */}
          <div className="preview-loader-logo relative size-14 overflow-hidden">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="absolute inset-0 size-full"
              fill={GREEN}
            >
              <defs>
                <mask id="logo-mask">
                  <rect width="24" height="24" fill="black" />
                  <path fill="white" d="M12 2.5L2 20.5h4.5l5.5-9.9 5.5 9.9H22L12 2.5z" />
                </mask>
                <linearGradient id="sheen-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"  stopColor="white" stopOpacity="0"    />
                  <stop offset="50%" stopColor="white" stopOpacity="0.7"  />
                  <stop offset="100%" stopColor="white" stopOpacity="0"   />
                </linearGradient>
              </defs>

              <path d="M12 2.5L2 20.5h4.5l5.5-9.9 5.5 9.9H22L12 2.5z" />

              <rect
                className="preview-loader-block"
                x="10" y="14.5"
                width="4" height="4"
                rx="0.75"
                fill={GREEN_BRIGHT}
              />

              <g mask="url(#logo-mask)">
                <rect
                  className="preview-loader-sheen"
                  x="-6" y="0"
                  width="12" height="24"
                  fill="url(#sheen-grad)"
                />
              </g>
            </svg>
          </div>
        </div>

        {/* Progress track */}
        <div className="relative h-[3px] w-[120px] overflow-hidden rounded-full bg-white/10">
          <div
            className="preview-loader-progress-fill absolute inset-y-0 left-0 w-full origin-left rounded-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${GREEN_BRIGHT} 40%, ${GREEN} 60%, transparent)`,
            }}
          />
        </div>

        {/* Bouncing dots */}
        <div className="flex items-center gap-1.5">
          {[0, 0.15, 0.3].map((delay, i) => (
            <span
              key={i}
              className="preview-loader-dot size-1.5 rounded-full"
              style={{
                background: GREEN_BRIGHT,
                animationDelay: `${delay}s`,
              }}
            />
          ))}
        </div>
      </div>

      <span className="sr-only">Loading preview of {fileName}</span>
    </div>
  );
}
