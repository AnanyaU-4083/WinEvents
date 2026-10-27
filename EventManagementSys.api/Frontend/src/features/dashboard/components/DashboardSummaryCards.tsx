// Summarize key event counts here.
interface DashboardSummaryCardsProps {
  total: number;
  scheduled: number;
  completed: number;
  upcoming: number;
}

const cards = [
  { label: 'Total Events', key: 'total', caption: 'All time', tone: 'blue', icon: 'calendar' },
  { label: 'Scheduled', key: 'scheduled', caption: 'Upcoming & ongoing', tone: 'mint', icon: 'clock' },
  { label: 'Completed', key: 'completed', caption: 'This month', tone: 'lavender', icon: 'check' },
  { label: 'Upcoming', key: 'upcoming', caption: 'Next events', tone: 'peach', icon: 'sun' },
] as const;

const icons = {
  calendar: <><rect x="3.5" y="5" width="17" height="15" rx="3" /><path d="M8 3v4M16 3v4M4 9h16M8 13h.01M12 13h.01M16 13h.01M8 16h.01M12 16h.01" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
};

function DashboardSummaryCards({ total, scheduled, completed, upcoming }: DashboardSummaryCardsProps) {
  const values = { total, scheduled, completed, upcoming };

  return (
    <section className="dashboard-stat-grid" aria-label="Event summary">
      {cards.map((card) => (
        <article key={card.key} className={`dashboard-stat-card dashboard-stat-${card.tone}`}>
          <span className="dashboard-stat-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {icons[card.icon]}
            </svg>
          </span>
          <div className="dashboard-stat-content">
            <span className="dashboard-stat-label">{card.label}</span>
            <strong className="dashboard-stat-value">{values[card.key]}</strong>
            <span className="dashboard-stat-caption">{card.caption}</span>
          </div>
        </article>
      ))}
    </section>
  );
}

export default DashboardSummaryCards;

