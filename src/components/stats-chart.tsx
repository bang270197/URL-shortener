import React from "react";

type MonthlyClick = {
  month: string;
  clicks: number;
};

export function StatsChart({ data }: { data: MonthlyClick[] }) {
  if (data.length === 0) {
    return (
      <section className="card analytics-section" aria-labelledby="monthly-activity-title">
        <h2 id="monthly-activity-title">Monthly activity</h2>
        <p className="stats-copy">No monthly activity yet. Your first recorded click will appear here.</p>
      </section>
    );
  }

  const maximum = Math.max(...data.map((item) => item.clicks), 1);

  return (
    <section className="card analytics-section" aria-labelledby="monthly-activity-title">
      <h2 id="monthly-activity-title">Monthly activity</h2>
      <ul className="chart-list" aria-label="Monthly click activity">
        {data.map((item) => (
          <li key={item.month}>
            <span>{item.month}: {item.clicks} clicks</span>
            <span className="chart-track" aria-hidden="true">
              <span className="chart-bar" style={{ width: `${(item.clicks / maximum) * 100}%` }} />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
