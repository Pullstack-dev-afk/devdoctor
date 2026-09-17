"use client";

import { useState } from "react";
import { focusAreas, type Diagnosis, type FocusArea } from "@/lib/diagnostics";

const sampleInput = `Warning  Failed     3m (x4 over 5m)  kubelet  Failed to pull image "ghcr.io/acme/payments:latest":
rpc error: code = Unknown desc = failed to authorize: failed to fetch anonymous token:
unexpected status from GET request to https://ghcr.io/token?scope=repository%3Aacme%2Fpayments%3Apull&service=ghcr.io: 401 Unauthorized

pod/payments-7c6f84d9b6-zk9p2  0/1  ImagePullBackOff  0  5m`;

export default function Home() {
  const [focusArea, setFocusArea] = useState<FocusArea>("Kubernetes");
  const [input, setInput] = useState(sampleInput);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function diagnose() {
    setIsLoading(true);
    setError("");
    setCopied(false);
    try {
      const response = await fetch("/api/diagnose", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input, focusArea }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setDiagnosis(data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  async function copyFix() {
    if (!diagnosis) return;
    await navigator.clipboard.writeText(diagnosis.fix);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Dev Doctor home"><span className="brand-mark">+</span><span>dev<span className="brand-muted">doctor</span></span></a>
        <div className="topbar-right"><span className="status-dot" /><span>Diagnostic engine online</span><button className="icon-button" aria-label="Open settings">•••</button></div>
      </header>

      <section className="intro" id="top">
        <div className="eyebrow"><span className="eyebrow-line" />INFRASTRUCTURE DIAGNOSTICS</div>
        <h1>Stop guessing.<br /><em>Start fixing.</em></h1>
        <p className="lede">Paste the thing that broke. Get the root cause, the reasoning, and a fix you can run with confidence.</p>
      </section>

      <section className="workbench" aria-label="Dev Doctor diagnostic workbench">
        <div className="input-panel">
          <div className="panel-heading"><div><span className="step-label">01 / INPUT</span><h2>What went wrong?</h2></div><span className="secure-label">LOCAL &amp; SECURE <span className="lock">⌁</span></span></div>
          <div className="focus-row"><span>Focus area</span><div className="focus-tabs">{focusAreas.map((area) => <button key={area} className={focusArea === area ? "focus-tab active" : "focus-tab"} onClick={() => setFocusArea(area)}>{area}</button>)}</div></div>
          <textarea value={input} onChange={(event) => setInput(event.target.value)} aria-label="Error or configuration input" placeholder="Paste an error, log, or configuration..." />
          <div className="input-footer"><span>{input.length.toLocaleString()} characters · Secrets are not stored</span><button className="clear-button" onClick={() => setInput("")}>Clear input</button></div>
          <button className="diagnose-button" onClick={diagnose} disabled={isLoading || !input.trim()}><span>{isLoading ? "Reading the signal..." : "Diagnose this"}</span><span className="arrow">↗</span></button>
          {error && <p className="error-message">{error}</p>}
        </div>

        <div className={diagnosis ? "result-panel" : "result-panel empty-result"}>
          {!diagnosis ? <div className="empty-state"><div className="pulse-mark">+</div><h2>Your diagnosis<br /><span>will appear here.</span></h2><p>We&apos;ll trace the signal from symptom to root cause, then give you the smallest safe fix.</p><div className="empty-rule" /><span className="empty-hint">READY WHEN YOU ARE</span></div> : <DiagnosisView diagnosis={diagnosis} copied={copied} onCopy={copyFix} />}
        </div>
      </section>

      <footer><span>DEV DOCTOR <span className="footer-muted">/ BUILT FOR THE 2AM DEPLOY</span></span><span>v0.1 · No data retained</span></footer>
    </main>
  );
}

function DiagnosisView({ diagnosis, copied, onCopy }: { diagnosis: Diagnosis; copied: boolean; onCopy: () => void }) {
  return <div className="diagnosis"><div className="result-top"><span className="step-label">02 / DIAGNOSIS</span><span className={`confidence ${diagnosis.severity}`}>● {diagnosis.confidence}% confidence</span></div><h2>{diagnosis.title}</h2><p className="result-summary">{diagnosis.summary}</p><div className="result-section"><div className="section-title"><span className="section-number">A</span><span>WHY IT&apos;S HAPPENING</span></div><ul>{diagnosis.why.map((item) => <li key={item}>{item}</li>)}</ul></div><div className="fix-section"><div className="fix-heading"><div className="section-title"><span className="section-number">B</span><span>THE FIX</span></div><button className="copy-button" onClick={onCopy}>{copied ? "Copied" : "Copy fix"} <span>□</span></button></div><pre><code>{diagnosis.fix}</code></pre></div><div className="checks"><div className="section-title"><span className="section-number">C</span><span>VERIFY AFTER</span></div><div className="check-grid">{diagnosis.checks.map((item) => <span key={item}>✓ {item}</span>)}</div></div></div>;
}