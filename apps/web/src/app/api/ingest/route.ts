import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ENV } from "@/lib/env";

export async function POST(req: Request) {
  const apiKey = req.headers.get("x-api-key") ?? "";
  if (!ENV.INGEST_API_KEY || apiKey !== ENV.INGEST_API_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const siteSlug = String(body.site ?? "");
  const probeName = String(body.probeName ?? "unknown");

  if (!siteSlug) return NextResponse.json({ error: "site required" }, { status: 400 });

  const site =
    (await prisma.site.findUnique({ where: { slug: siteSlug } })) ??
    (await prisma.site.create({ data: { slug: siteSlug, name: siteSlug } }));

  const measurements = Array.isArray(body.measurements) ? body.measurements : [];
  if (!measurements.length) return NextResponse.json({ ok: true, inserted: 0 });

  const rows = measurements.map((m: any) => ({
    siteId: site.id,
    probeName,
    pingTarget: m.pingTarget ?? null,
    httpTarget: m.httpTarget ?? null,
    dnsServer: m.dnsServer ?? null,
    latencyMs: m.latencyMs ?? null,
    jitterMs: m.jitterMs ?? null,
    lossPct: m.lossPct ?? null,
    dnsLookupMs: m.dnsLookupMs ?? null,
    httpTtfbMs: m.httpTtfbMs ?? null,
    createdAt: m.createdAt ? new Date(m.createdAt) : new Date()
  }));

  await prisma.measurement.createMany({ data: rows });
  return NextResponse.json({ ok: true, inserted: rows.length });
}
