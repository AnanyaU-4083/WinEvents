// Summarize key event counts here.
interface DashboardSummaryCardsProps {
  total: number;
  scheduled: number;
  cancelled: number;
  upcoming: number;
}

const cards = [
  { label: 'Total Events', key: 'total', color: 'var(--color-brand-primary)' },
  { label: 'Scheduled', key: 'scheduled', color: 'var(--color-accent-orange)' },
  { label: 'Cancelled', key: 'cancelled', color: 'var(--color-state-error)' },
  { label: 'Upcoming', key: 'upcoming', color: 'var(--color-state-success)' },
] as const;

function DashboardSummaryCards({
  total,
  scheduled,
  cancelled,
  upcoming,
}: DashboardSummaryCardsProps) {
  const values = { total, scheduled, cancelled, upcoming };

  return (
    <section className="mb-[30px] grid grid-cols-4 gap-5 max-[900px]:grid-cols-2 max-[700px]:grid-cols-1">
      {cards.map((card) => (
        <div
          key={card.label}
          className="glass-panel summary-accent-card p-6"
          style={{ borderTopColor: card.color }}
        >
          <span className="text-[14px] font-medium text-text-muted">{card.label}</span>
          <strong className="mt-2 block text-[30px] font-[750] text-text-primary">
            {values[card.key]}
          </strong>
        </div>
      ))}
    </section>
  );
}

export default DashboardSummaryCards;
