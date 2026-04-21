import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Database, FileText, Leaf, PhilippinePeso, TrendingDown, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getImpactStats } from "@/lib/api";
import type { FileKind, ImpactStats } from "@/lib/types";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

const CARD_SHADOW =
  "shadow-[0_1px_0_rgba(16,24,40,0.02),0_1px_3px_rgba(16,24,40,0.04)]";

const KIND_ORDER: FileKind[] = [
  "pdf",
  "docx",
  "pptx",
  "image",
  "video",
  "other",
];

const KIND_LABELS: Record<FileKind, string> = {
  pdf: "PDF",
  docx: "Word",
  pptx: "PowerPoint",
  image: "Images",
  video: "Videos",
  other: "Other",
};

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  trend?: { value: string; positive: boolean };
}

function StatCard({ label, value, sub, icon: Icon, trend }: StatCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-white p-5",
        CARD_SHADOW,
        "transition-all duration-300 hover:border-primary/20 hover:shadow-md"
      )}
    >
      {/* Background Watermark */}
      <div className="pointer-events-none absolute -bottom-6 -right-6 text-primary/[0.03] transition-transform duration-500 group-hover:-translate-x-2 group-hover:-translate-y-2 group-hover:scale-110 group-hover:text-primary/[0.05]">
        <Icon className="size-32" strokeWidth={1.5} />
      </div>

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
          <Icon className="size-5" strokeWidth={2} />
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-semibold tracking-wide",
              trend.positive
                ? "bg-emerald-50 text-emerald-600"
                : "bg-rose-50 text-rose-600"
            )}
          >
            {trend.value}
            {trend.positive ? (
              <TrendingUp className="size-3.5" strokeWidth={2.5} />
            ) : (
              <TrendingDown className="size-3.5" strokeWidth={2.5} />
            )}
          </div>
        )}
      </div>
      
      <div className="relative z-10 mt-8 flex flex-col gap-1">
        <span className="text-[12.5px] font-medium text-muted-foreground">
          {label}
        </span>
        <span className="text-[28px] font-bold leading-none tracking-tight text-foreground tabular-nums">
          {value}
        </span>
        <span className="mt-1 text-[12.5px] leading-snug text-muted-foreground">
          {sub}
        </span>
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div
      className={cn(
        "relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-white p-5",
        CARD_SHADOW
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="size-10 rounded-xl" />
        <Skeleton className="h-6 w-14 rounded-md" />
      </div>
      <div className="mt-8 flex flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <Card className={`border border-border/70 ${CARD_SHADOW}`}>
      <CardHeader>
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full rounded-md" />
      </CardContent>
    </Card>
  );
}

function BreakdownSkeleton() {
  return (
    <Card className={`border border-border/70 ${CARD_SHADOW}`}>
      <CardHeader>
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[74px] rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ImpactPage() {
  const [stats, setStats] = useState<ImpactStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    getImpactStats().then((result) => {
      if (cancelled) return;
      setStats(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const trendData =
    stats?.trend.map((t) => ({
      date: t.date.slice(5),
      bytesSaved: t.bytesSaved,
    })) ?? [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
      {/* Heading */}
      <header className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Impact
        </span>
        <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
          Sustainability impact
        </h1>
        <p className="text-[14px] leading-snug text-muted-foreground">
          Every file compressed is storage, bandwidth, and energy saved.
        </p>
      </header>

      {/* Stat cards */}
      {stats === null ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label="Storage saved"
            value={formatBytes(stats.bytesSaved)}
            sub={`of ${formatBytes(stats.totalOriginalBytes)} original`}
            icon={Database}
            trend={{ value: "24%", positive: true }}
          />
          <StatCard
            label="CO₂ avoided"
            value={`${stats.co2KgAvoided} kg`}
            sub="vs. uncompressed baseline"
            icon={Leaf}
            trend={{ value: "15%", positive: true }}
          />
          <StatCard
            label="Pesos saved"
            value={`₱${stats.pesosSaved.toLocaleString()}`}
            sub="at current institutional rates"
            icon={PhilippinePeso}
            trend={{ value: "20%", positive: true }}
          />
          <StatCard
            label="Files archived"
            value={stats.fileCount.toString()}
            sub="across all departments"
            icon={FileText}
            trend={{ value: "11%", positive: false }}
          />
        </div>
      )}

      {/* Trend chart */}
      {stats === null ? (
        <ChartSkeleton />
      ) : (
        <Card className={`border border-border/70 ${CARD_SHADOW}`}>
          <CardHeader>
            <CardTitle className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Savings trend — last 30 days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="impact-gradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="100%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 11,
                    }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    minTickGap={24}
                  />
                  <YAxis
                    tickFormatter={(value) => formatBytes(Number(value))}
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 11,
                    }}
                    tickLine={false}
                    axisLine={false}
                    width={64}
                  />
                  <Tooltip
                    cursor={{
                      stroke: "hsl(var(--border))",
                      strokeDasharray: "3 3",
                    }}
                    contentStyle={{
                      background: "white",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                      boxShadow:
                        "0 1px 0 rgba(16,24,40,0.02), 0 1px 3px rgba(16,24,40,0.04)",
                    }}
                    labelStyle={{
                      color: "hsl(var(--muted-foreground))",
                      fontSize: 11,
                    }}
                    formatter={(value) => [
                      formatBytes(Number(value)),
                      "Saved",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="bytesSaved"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#impact-gradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* By file type */}
      {stats === null ? (
        <BreakdownSkeleton />
      ) : (
        <Card className={`border border-border/70 ${CARD_SHADOW}`}>
          <CardHeader>
            <CardTitle className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              By file type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {KIND_ORDER.map((kind) => {
                const entry = stats.byKind[kind] ?? {
                  count: 0,
                  bytesSaved: 0,
                };
                return (
                  <div
                    key={kind}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border/70 bg-[hsl(48_25%_98%)] p-3"
                  >
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        {KIND_LABELS[kind]}
                      </span>
                      <span className="text-[12.5px] tabular-nums text-muted-foreground">
                        {entry.count}{" "}
                        {entry.count === 1 ? "file" : "files"}
                      </span>
                    </div>
                    <span className="text-right text-[13px] font-medium tabular-nums text-foreground">
                      {formatBytes(entry.bytesSaved)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
