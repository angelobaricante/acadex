const GREEN = "hsl(142 75% 68%)";
const GREEN_BRIGHT = "hsl(142 85% 78%)";

interface BrandSpinnerProps {
  size?: number;
  className?: string;
}

export default function BrandSpinner({ size = 22, className }: BrandSpinnerProps) {
  const gradId = `brand-spinner-${size}`;
  return (
    <div
      className={`relative grid place-items-center ${className ?? ""}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 40 40"
        className="preview-loader-ring-outer absolute inset-0 size-full"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={GREEN} stopOpacity="0" />
            <stop offset="60%" stopColor={GREEN} stopOpacity="0.6" />
            <stop offset="100%" stopColor={GREEN_BRIGHT} stopOpacity="1" />
          </linearGradient>
        </defs>
        <circle
          cx="20"
          cy="20"
          r="17"
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="52 80"
        />
      </svg>
      <div
        className="preview-loader-logo relative"
        style={{ width: size * 0.55, height: size * 0.55 }}
      >
        <svg viewBox="0 0 24 24" className="size-full" fill={GREEN}>
          <path d="M12 2.5L2 20.5h4.5l5.5-9.9 5.5 9.9H22L12 2.5z" />
        </svg>
      </div>
    </div>
  );
}
