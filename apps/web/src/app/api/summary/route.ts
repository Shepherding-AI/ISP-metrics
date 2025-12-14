import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function round(n: number | null, digits = 0) {
  if (n === null || Number.isNaN(n)) return null;
  const m = Math.pow(10, digits);
  return Math.round(n * m) / m;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const site = searchParams.get("site") ?? "lab";
  const since = new Date(Date.now() - 60 * 60 * 1000);

  const s = await prisma.site.findUnique({ where: { slug: site } });
  if (!s) {
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      avgLatencyMs: null,
      p95LatencyMs: null,
      avgLossPct: null,
      avgDnsMs: null
    });
  }

  const rows = await prisma.measurement.findMany({
    where: { siteId: s.id, createdAt: { gte: since } },
    select: { latencyMs: true, lossPct: true, dnsLookupMs: true },
    orderBy: { createdAt: "asc" }
  });

  const latency = rows.map(r => r.latencyMs).filter((v): v is number => typeof v === "number");
  const loss = rows.map(r => r.lossPct).filter((v): v is number => typeof v === "number");
  const dns = rows.map(r => r.dnsLookupMs).filter((v): v is number => typeof v === "number");

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : NaN);
  const p95 = (arr: number[]) => {
    if (!arr.length) return NaN;
    const sorted = [...arr].sort((a,b)=>a-b);
    const idx = Math.floor(0.95 * (sorted.length - 1));
    return sorted[idx];
  };

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    avgLatencyMs: round(Number.isFinite(avg(latency)) ? avg(latency) : null, 1),
    p95LatencyMs: round(Number.isFinite(p95(latency)) ? p95(latency) : null, 1),
    avgLossPct: round(Number.isFinite(avg(loss)) ? avg(loss) : null, 2),
    avgDnsMs: round(Number.isFinite(avg(dns)) ? avg(dns) : null, 1)
  });
}
