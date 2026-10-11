"use client";

import React, { FormEvent, useState } from "react";

export function CreateLinkForm() {
  const [url, setUrl] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [shortUrl, setShortUrl] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setPending(true);
    try {
      const response = await fetch("/api/links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destinationUrl: url, code }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setShortUrl(data.shortUrl);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to create the link."); }
    finally { setPending(false); }
  }

  return <form className="card form-card" onSubmit={submit}>
    <div className="field"><label htmlFor="url">Destination URL</label><input className="input" id="url" type="url" required placeholder="https://example.com/your-long-link" value={url} onChange={event => setUrl(event.target.value)} /></div>
    <div className="field"><label htmlFor="code">Custom code</label><div className="code-row"><span className="code-prefix">shortly.app/</span><input className="input" id="code" required minLength={3} maxLength={50} pattern="[A-Za-z0-9-]{3,50}" placeholder="my-link" value={code} onChange={event => setCode(event.target.value)} /></div></div>
    {error && <p className="error" role="alert">{error}</p>}
    <button className="button" disabled={pending}>{pending ? "Creating…" : "Create short link"}</button>
    {shortUrl && <div className="result"><div><strong>Ready to share</strong><br /><code>{shortUrl}</code></div><button className="button" type="button" onClick={() => navigator.clipboard.writeText(shortUrl)}>Copy</button></div>}
  </form>;
}
