"use client";
import React, { useState } from "react";

export function AiAdvisor({ site }: { site: string }) {
  const [question, setQuestion] = useState("What does the last 2 hours tell us about ISP health?");
  const [answer, setAnswer] = useState("Ask me about spikes, packet loss, and next steps.");
  const [loading, setLoading] = useState(false);

  async function ask() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ site, question })
      });
      const data = await res.json();
      setAnswer(data.answer ?? "No answer returned.");
    } catch (e: any) {
      setAnswer(e?.message ?? "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="cardTitle">AI Advisor</div>
      <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
        (Stub for now) — next step is wiring to your OpenAI key.
      </div>
      <div className="pill" style={{ marginBottom: 12 }}>Site: {site}</div>
      <textarea value={question} onChange={(e) => setQuestion(e.target.value)} style={{ minHeight: 96, resize: "vertical" }} />
      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <button className="button" onClick={ask} disabled={loading}>{loading ? "Thinking…" : "Ask"}</button>
      </div>
      <hr />
      <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.4, fontSize: 13 }}>{answer}</div>
    </div>
  );
}
