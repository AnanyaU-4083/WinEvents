interface DashboardSummaryCardsProps {
  total: number
  scheduled: number
  cancelled: number
  upcoming: number
}

const cards = [
  { label: 'Total Events', key: 'total', color: '#0066ff' },
  { label: 'Scheduled', key: 'scheduled', color: '#ff7a00' },
  { label: 'Cancelled', key: 'cancelled', color: '#dc2626' },
  { label: 'Upcoming', key: 'upcoming', color: '#15803d' },
] as const

function DashboardSummaryCards({
  total,
  scheduled,
  cancelled,
  upcoming,
}: DashboardSummaryCardsProps) {
  const values = { total, scheduled, cancelled, upcoming }

  return (
    <section className="mb-[30px] grid grid-cols-4 gap-5 max-[900px]:grid-cols-2 max-[700px]:grid-cols-1">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-[#1e5b79]/35 border-t-4 bg-white/40 p-[22px] shadow-xl shadow-slate-900/20 backdrop-blur-md"
          style={{ borderTopColor: card.color }}
        >
          <span className="text-[14px] font-medium text-[#6b7280]">
            {card.label}
          </span>
          <strong className="mt-2 block text-[30px] font-[750] text-[#111827]">
            {values[card.key]}
          </strong>
        </div>
      ))}
    </section>
  )
}

export default DashboardSummaryCards
