import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const siteSlug = String(body.site ?? "lab");
  const question = String(body.question ?? "");

  const site = await prisma.site.findUnique({ where: { slug: siteSlug } });
  if (!site) return NextResponse.json({ answer: "No data yet for this site. Start the on‑prem agent." });

  const since = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const rows = await prisma.measurement.findMany({
    where: { siteId: site.id, createdAt: { gte: since } },
    select: { latencyMs: true, lossPct: true },
    orderBy: { createdAt: "asc" }
  });

  const rows: Array<{ latencyMs: number | null; lossPct: number | null }> =
  await prisma.measurement.findMany({
    where: { siteId: site.id, createdAt: { gte: since } },
    select: { latencyMs: true, lossPct: true },
    orderBy: { createdAt: "asc" }
  });

const latency = rows
  .map((r) => r.latencyMs)
  .filter((v): v is number => typeof v === "number");

const loss = rows
  .map((r) => r.lossPct)
  .filter((v): v is number => typeof v === "number");

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : NaN);
  const max = (arr: number[]) => (arr.length ? Math.max(...arr) : NaN);

  const answer =
`(AI stub)\n\nQuestion: ${question}\n\nLast 2h:\n- Samples: ${rows.length}\n- Avg latency: ${Number.isFinite(avg(latency)) ? avg(latency).toFixed(1) + " ms" : "—"}\n- Max latency: ${Number.isFinite(max(latency)) ? max(latency).toFixed(1) + " ms" : "—"}\n- Avg loss: ${Number.isFinite(avg(loss)) ? avg(loss).toFixed(2) + "%" : "—"}\n\nNext: wire to OpenAI and return real analysis + next steps.`;

  return NextResponse.json({ answer });
}
