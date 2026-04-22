/**
 * AcaDexLogo — minimalist SVG mark.
 *
 * An 'A' chevron with a floating compressed-data block as the crossbar,
 * symbolising the system's file-compression mission.
 *
 * Props:
 *   size  — controls both width and height via Tailwind `size-*` class.
 *           Defaults to "size-[18px]" (matches the login-page icon slot).
 */
interface AcaDexLogoProps {
  /** Tailwind size utility, e.g. "size-[18px]" or "size-4" */
  size?: string;
}

export default function AcaDexLogo({ size = "size-[18px]" }: AcaDexLogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={size}
    >
      {/* Outer chevron — forms the letter 'A' */}
      <path d="M12 2.5L2 20.5h4.5l5.5-9.9 5.5 9.9H22L12 2.5z" />
      {/* Floating block — replaces the crossbar, represents a compressed file */}
      <rect x="10" y="14.5" width="4" height="4" rx="0.75" />
    </svg>
  );
}
