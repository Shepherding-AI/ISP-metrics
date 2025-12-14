import { AiAdvisor } from "@/components/AiAdvisor";
import { ENV } from "@/lib/env";

async function getJson(path: string) {
  const base = ENV.BASE_URL || "";
  const res = await fetch(`${base}${path}`, { cache: "no-store" });
  return res.json();
}

export default async function Page() {
  const site = "lab";
  const summary = await getJson(`/api/summary?site=${encodeURIComponent(site)}`);

  return (
    <div>
      <div className="header">
        <div>
          <div className="h1">ISP Health Dashboard</div>
          <div className="muted" style={{ fontSize: 13 }}>
            Persistent telemetry + AI insights (site: <b>{site}</b>)
          </div>
        </div>
        <div className="pill">Updated: {new Date(summary.generatedAt).toLocaleString()}</div>
      </div>

      <div className="row">
        <div className="main">
          <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 16 }}>
            <div className="card">
              <div className="cardTitle">Avg latency (ms)</div>
              <div className="big">{summary.avgLatencyMs ?? "—"}</div>
              <div className="muted" style={{ fontSize: 12 }}>Last 60 min</div>
            </div>
            <div className="card">
              <div className="cardTitle">P95 latency (ms)</div>
              <div className="big">{summary.p95LatencyMs ?? "—"}</div>
              <div className="muted" style={{ fontSize: 12 }}>Last 60 min</div>
            </div>
            <div className="card">
              <div className="cardTitle">Packet loss (%)</div>
              <div className="big">{summary.avgLossPct ?? "—"}</div>
              <div className="muted" style={{ fontSize: 12 }}>Last 60 min</div>
            </div>
            <div className="card">
              <div className="cardTitle">DNS (ms)</div>
              <div className="big">{summary.avgDnsMs ?? "—"}</div>
              <div className="muted" style={{ fontSize: 12 }}>Last 60 min</div>
            </div>
          </div>

          <div className="card">
            <div className="cardTitle">Next</div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              Charts + incidents are next — this starter repo focuses on <b>ingest → store → summarize</b>.
            </div>
          </div>
        </div>

        <div className="sidebar">
          <AiAdvisor site={site} />
          <div className="card" style={{ marginTop: 16 }}>
            <div className="cardTitle">Ingest endpoint</div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              <div className="muted">POST</div>
              <div><b>/api/ingest</b></div>
              <div className="muted" style={{ marginTop: 8 }}>
                Send measurements from the on‑prem probe agent with <code>x-api-key</code>.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="muted" style={{ fontSize: 12, marginTop: 18 }}>
        Tip: run the agent for ~2–3 minutes and refresh this page.
      </div>
    </div>
  );
}
