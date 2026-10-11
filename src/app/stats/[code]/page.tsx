import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicLinkAnalytics } from "@/lib/analytics";
import { StatsBreakdown } from "@/components/stats-breakdown";
import { StatsChart } from "@/components/stats-chart";

export default async function StatsPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const analytics = await getPublicLinkAnalytics(code);
  if (!analytics) notFound();

  return (
    <>
      <header className="shell topbar">
        <Link className="brand" href="/">Short<i>ly</i></Link>
        <Link className="nav-link" href="/">Create a link</Link>
      </header>
      <main className="shell stats">
        <p className="eyebrow">Public analytics</p>
        <h1>Analytics for {analytics.code}</h1>
        <p className="stats-copy">A clear, privacy-first view of how this short link is performing.</p>
        <section className="card stats-card">
          <span>Total clicks</span>
          <strong>{analytics.totalClicks}</strong>
          <p>{analytics.totalClicks === 0 ? "No clicks yet. Share your link to start collecting insights." : "Recorded visits to this link."}</p>
        </section>
        <StatsChart data={analytics.monthlyClicks} />
        <StatsBreakdown devices={analytics.devices} browsers={analytics.browsers} />
      </main>
    </>
  );
}
