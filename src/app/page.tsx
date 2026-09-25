"use client";

import { useRef, useState } from "react";
import { focusAreas, MAX_INPUT_LENGTH, type Diagnosis, type FocusArea } from "@/lib/diagnostics";

async function copyTextWithFallback(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
    }
  }

  const copyTarget = document.createElement("textarea");
  copyTarget.value = text;
  copyTarget.setAttribute("readonly", "");
  copyTarget.style.position = "fixed";
  copyTarget.style.opacity = "0";
  document.body.appendChild(copyTarget);
  try {
    copyTarget.select();
    if (!document.execCommand("copy")) throw new Error("Copy was not available.");
  } finally {
    copyTarget.remove();
  }
}

export default function Home() {
  const [focusArea, setFocusArea] = useState<FocusArea>("Kubernetes");
  const [input, setInput] = useState("");
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  async function diagnose() {
    setIsLoading(true);
    setError("");
    setCopied(false);
    try {
      const response = await fetch("/api/diagnose", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input, focusArea }) });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "We could not analyze that input. Please try again.");
      setDiagnosis(data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  async function copyFix() {
    if (!diagnosis) return;
    try {
      await copyTextWithFallback(diagnosis.fix);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Copy failed. Select the corrected code and copy it manually.");
    }
  }

  function startNewDiagnosis() {
    setDiagnosis(null);
    setError("");
    setCopied(false);
    inputRef.current?.focus();
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
        <p className="lede">Paste an error, log, or config. Get the root cause and an actionable fix you can run with confidence.</p>
      </section>

      <section className="workbench" aria-label="Dev Doctor diagnostic workbench">
        <div className="input-panel">
          <div className="panel-heading"><div><span className="step-label">01 / INPUT</span><h2>What went wrong?</h2></div><span className="secure-label">LOCAL &amp; SECURE <span className="lock">⌁</span></span></div>
          <div className="focus-row"><span>Focus area</span><div className="focus-tabs" role="group" aria-label="Technology focus">{focusAreas.map((area) => <button type="button" key={area} className={focusArea === area ? "focus-tab active" : "focus-tab"} aria-pressed={focusArea === area} onClick={() => setFocusArea(area)}>{area}</button>)}</div></div>
          <textarea ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} maxLength={MAX_INPUT_LENGTH} aria-label="Error or configuration input" placeholder={'Example: "ImagePullBackOff" or a failed CI step, Dockerfile, or Terraform plan...'} />
          <div className="input-footer"><span>{input.length.toLocaleString()} characters · Secrets are not stored</span><button className="clear-button" onClick={() => setInput("")}>Clear input</button></div>
          <button type="button" className="diagnose-button" onClick={diagnose} disabled={isLoading || !input.trim()} aria-busy={isLoading}><span className={isLoading ? "loading-label" : ""}>{isLoading && <span className="spinner" aria-hidden="true" />}{isLoading ? "Reading the signal..." : "Diagnose this"}</span><span className="arrow">↗</span></button>
          {error && <p className="error-message" role="alert">{error}</p>}
        </div>

        <div className={diagnosis ? "result-panel" : "result-panel empty-result"}>
          {!diagnosis ? <div className="empty-state"><div className="pulse-mark">+</div><h2>Your diagnosis<br /><span>will appear here.</span></h2><p>We&apos;ll trace the signal from symptom to root cause, then give you the smallest safe fix.</p><div className="empty-rule" /><span className="empty-hint">READY WHEN YOU ARE</span></div> : <DiagnosisView diagnosis={diagnosis} copied={copied} onCopy={copyFix} onNew={startNewDiagnosis} />}
        </div>
      </section>

      <footer><span>DEV DOCTOR <span className="footer-muted">/ BUILT FOR THE 2AM DEPLOY</span></span><span>v0.1 · No data retained</span></footer>
    </main>
  );
}

function DiagnosisView({ diagnosis, copied, onCopy, onNew }: { diagnosis: Diagnosis; copied: boolean; onCopy: () => void; onNew: () => void }) {
  return <div className="diagnosis"><div className="result-top"><span className="step-label">02 / DIAGNOSIS</span><div className="result-actions"><span className={`confidence ${diagnosis.severity}`}>● {diagnosis.confidence}% confidence</span><button type="button" className="new-diagnosis" onClick={onNew}>+ New diagnosis</button></div></div><div className="result-section problem-section"><div className="section-title"><span className="section-number">A</span><span>PROBLEM</span></div><h2>{diagnosis.title}</h2><p className="result-summary">{diagnosis.summary}</p></div><div className="result-section"><div className="section-title"><span className="section-number">B</span><span>ROOT CAUSE</span></div><ul>{diagnosis.why.map((item) => <li key={item}>{item}</li>)}</ul></div><div className="fix-section"><div className="fix-heading"><div className="section-title"><span className="section-number">C</span><span>FIX</span></div><button type="button" className="copy-button" onClick={onCopy}>{copied ? "Copied" : "Copy fix"} <span>□</span></button></div><p className="fix-note">Apply the recommended command or configuration below.</p><div className="code-label">CORRECTED CODE</div><pre><code>{diagnosis.fix}</code></pre></div><div className="checks"><div className="section-title"><span className="section-number">D</span><span>ADDITIONAL CHECKS</span></div><div className="check-grid">{diagnosis.checks.map((item) => <span key={item}>✓ {item}</span>)}</div>{diagnosis.references.length > 0 && <div className="references">{diagnosis.references.map((item) => <span key={item}>{item}</span>)}</div>}</div></div>;
}