import React from "react";
import Link from "next/link";

import { CreateLinkForm } from "@/components/create-link-form";
import { listRecentShortLinks } from "@/lib/links";

export default async function Home() {
  const recentLinks = await listRecentShortLinks();

  return <>
    <header className="shell topbar"><Link className="brand" href="/">Short<i>ly</i></Link></header>
    <main className="shell">
      <section className="hero">
        <div className="eyebrow">Simple links. Clear results.</div>
        <h1>Create a short link that works harder.</h1>
        <p>Turn long URLs into memorable links and see exactly how people engage with them.</p>
        <CreateLinkForm />
      </section>
      <section className="recent-links" aria-labelledby="recent-links-heading">
        <div><p className="eyebrow">Your workspace</p><h2 id="recent-links-heading">Recent links</h2></div>
        {recentLinks.length === 0 ? <p className="recent-links-empty">No links yet. Create your first one above.</p> : <ul className="recent-links-list">
          {recentLinks.map((link) => <li key={link.id}>
            <div><code>{link.code}</code><span title={link.destinationUrl}>{link.destinationUrl}</span></div>
            <Link className="nav-link" href={`/stats/${link.code}`} aria-label={`View analytics for ${link.code}`}>View analytics</Link>
          </li>)}
        </ul>}
      </section>
      <section className="metrics"><div className="metric"><b>Custom URLs</b><span>Choose a short code that is easy to remember and share.</span></div><div className="metric"><b>Public analytics</b><span>See total clicks, monthly activity, devices, and browsers.</span></div><div className="metric"><b>Privacy first</b><span>Analytics stay useful without storing identifying data.</span></div></section>
    </main>
  </>;
}
