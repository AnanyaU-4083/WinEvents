import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description: ReactNode
  action?: ReactNode
  layout?: 'between' | 'responsive' | 'left'
}

function PageHeader({
  title,
  description,
  action,
  layout = 'between',
}: PageHeaderProps) {
  const layoutClass = {
    between: 'items-center justify-between',
    responsive: 'flex-col justify-between md:flex-row md:items-center',
    left: 'flex-col',
  }[layout]

  return (
    <header className={`mb-6 flex gap-4 ${layoutClass}`}>
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">{title}</h1>
        <p className="mt-1 text-sm text-[#6b7280]">{description}</p>
      </div>
      {action}
    </header>
  )
}

export default PageHeader
