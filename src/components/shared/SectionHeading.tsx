export default function SectionHeading({ label }: { label: string }) {
  return (
    <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
      {label}
    </span>
  );
}
