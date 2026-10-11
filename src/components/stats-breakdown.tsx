import React from "react";

type Breakdown = {
  label: string;
  clicks: number;
};

function BreakdownList({ title, items }: { title: string; items: Breakdown[] }) {
  const label = `${title.slice(0, -1)} click distribution`;

  return (
    <section className="card analytics-section" aria-labelledby={`${title}-title`}>
      <h2 id={`${title}-title`}>{title}</h2>
      {items.length > 0 ? (
        <ul className="breakdown-list" aria-label={label}>
          {items.map((item) => <li key={item.label}><span>{item.label}</span><strong>{item.clicks}</strong></li>)}
        </ul>
      ) : <p className="stats-copy">No recorded clicks yet.</p>}
    </section>
  );
}

export function StatsBreakdown({ devices, browsers }: { devices: Breakdown[]; browsers: Breakdown[] }) {
  return (
    <div className="breakdown-grid">
      <BreakdownList title="Devices" items={devices} />
      <BreakdownList title="Browsers" items={browsers} />
    </div>
  );
}
