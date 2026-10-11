import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLink } from "@/lib/links-store";

export default async function StatsPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const link = getLink(code);
  if (!link) notFound();
  return <><header className="shell topbar"><Link className="brand" href="/">Short<i>ly</i></Link><Link className="nav-link" href="/">Create a link</Link></header><main className="shell stats"><p className="eyebrow">Public analytics</p><h1>Analytics for {code}</h1><p className="stats-copy">A clear, privacy-first view of how this short link is performing.</p><section className="card stats-card"><span>Total clicks</span><strong>{link.clickCount}</strong><p>{link.clickCount === 0 ? "No clicks yet. Share your link to start collecting insights." : "Clicks recorded for this link."}</p></section></main></>;
}
