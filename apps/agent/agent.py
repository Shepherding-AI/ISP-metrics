import os
import time
import json
import subprocess
from datetime import datetime, timezone
from typing import List, Dict, Any

import requests
import dns.resolver

def env(name: str, default: str = "") -> str:
    v = os.getenv(name)
    return v if v is not None and v != "" else default

CLOUD_BASE_URL = env("CLOUD_BASE_URL", "http://localhost:3000").rstrip("/")
INGEST_API_KEY = env("INGEST_API_KEY", "")
SITE_SLUG = env("SITE_SLUG", "lab")
PROBE_NAME = env("PROBE_NAME", "onprem-1")
INTERVAL_SECONDS = int(env("INTERVAL_SECONDS", "15"))

PING_TARGETS = [x.strip() for x in env("PING_TARGETS", "1.1.1.1,8.8.8.8").split(",") if x.strip()]
HTTP_TARGETS = [x.strip() for x in env("HTTP_TARGETS", "https://www.google.com").split(",") if x.strip()]
DNS_HOSTNAME = env("DNS_HOSTNAME", "www.google.com")
DNS_SERVERS = [x.strip() for x in env("DNS_SERVERS", "1.1.1.1,8.8.8.8").split(",") if x.strip()]

def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()

def ping_target(target: str, count: int = 4, timeout_sec: int = 2) -> Dict[str, Any]:
    """
    Uses system ping (iputils-ping). Returns latency mean, jitter (mdev), loss %.
    """
    cmd = ["ping", "-c", str(count), "-W", str(timeout_sec), "-n", "-q", target]
    try:
        p = subprocess.run(cmd, capture_output=True, text=True, check=False)
        out = (p.stdout or "") + "\n" + (p.stderr or "")

        loss_pct = None
        for line in out.splitlines():
            if "packet loss" in line:
                parts = line.split(",")
                for part in parts:
                    if "packet loss" in part:
                        s = part.strip().split("%")[0]
                        s = "".join(ch for ch in s if (ch.isdigit() or ch == "."))
                        if s:
                            loss_pct = float(s)

        avg_ms = None
        mdev_ms = None
        for line in out.splitlines():
            if "min/avg" in line and "=" in line:
                rhs = line.split("=", 1)[1].strip()
                nums = rhs.split(" ")[0].split("/")
                if len(nums) >= 4:
                    avg_ms = float(nums[1])
                    mdev_ms = float(nums[3])

        return {"latencyMs": avg_ms, "jitterMs": mdev_ms, "lossPct": loss_pct}
    except Exception:
        return {"latencyMs": None, "jitterMs": None, "lossPct": None}

def dns_lookup(hostname: str, server: str, timeout_sec: float = 2.0) -> Dict[str, Any]:
    r = dns.resolver.Resolver(configure=False)
    r.nameservers = [server]
    r.timeout = timeout_sec
    r.lifetime = timeout_sec

    t0 = time.perf_counter()
    try:
        r.resolve(hostname, "A")
        ms = (time.perf_counter() - t0) * 1000.0
        return {"dnsLookupMs": ms}
    except Exception:
        ms = (time.perf_counter() - t0) * 1000.0
        return {"dnsLookupMs": ms}

def http_ttfb(url: str, timeout_sec: float = 4.0) -> Dict[str, Any]:
    t0 = time.perf_counter()
    try:
        with requests.get(url, timeout=timeout_sec, stream=True) as resp:
            resp.raise_for_status()
            for _ in resp.iter_content(chunk_size=1):
                break
        ms = (time.perf_counter() - t0) * 1000.0
        return {"httpTtfbMs": ms}
    except Exception:
        ms = (time.perf_counter() - t0) * 1000.0
        return {"httpTtfbMs": ms}

def build_payload() -> Dict[str, Any]:
    createdAt = iso_now()
    measurements: List[Dict[str, Any]] = []

    for t in PING_TARGETS:
        pr = ping_target(t)
        measurements.append({
            "createdAt": createdAt,
            "pingTarget": t,
            "latencyMs": pr.get("latencyMs"),
            "jitterMs": pr.get("jitterMs"),
            "lossPct": pr.get("lossPct")
        })

    for s in DNS_SERVERS:
        dr = dns_lookup(DNS_HOSTNAME, s)
        measurements.append({
            "createdAt": createdAt,
            "dnsServer": s,
            "dnsLookupMs": dr.get("dnsLookupMs")
        })

    for u in HTTP_TARGETS:
        hr = http_ttfb(u)
        measurements.append({
            "createdAt": createdAt,
            "httpTarget": u,
            "httpTtfbMs": hr.get("httpTtfbMs")
        })

    return {"site": SITE_SLUG, "probeName": PROBE_NAME, "measurements": measurements}

def post_payload(payload: Dict[str, Any]) -> None:
    url = f"{CLOUD_BASE_URL}/api/ingest"
    headers = {"x-api-key": INGEST_API_KEY, "content-type": "application/json"}
    r = requests.post(url, headers=headers, data=json.dumps(payload), timeout=10)
    if r.status_code >= 300:
        print(f"[{iso_now()}] POST {url} -> {r.status_code} {r.text[:200]}")
    else:
        print(f"[{iso_now()}] sent {len(payload.get('measurements', []))} measurements")

def main():
    print("ISP Probe Agent starting…")
    print(f"Cloud: {CLOUD_BASE_URL}")
    print(f"Site: {SITE_SLUG}  Probe: {PROBE_NAME}")
    print(f"Interval: {INTERVAL_SECONDS}s")
    if not INGEST_API_KEY:
        print("WARNING: INGEST_API_KEY is empty. Set it in .env and match the server.")
    while True:
        try:
            payload = build_payload()
            post_payload(payload)
        except Exception as e:
            print(f"[{iso_now()}] error: {e}")
        time.sleep(INTERVAL_SECONDS)

if __name__ == "__main__":
    main()
