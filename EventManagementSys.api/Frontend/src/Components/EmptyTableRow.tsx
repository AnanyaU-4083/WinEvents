interface EmptyTableRowProps {
  colSpan: number
  title: string
  description: string
}

function EmptyTableRow({ colSpan, title, description }: EmptyTableRowProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10">
        <div className="text-center">
          <h3 className="text-base font-semibold text-[#111827]">{title}</h3>
          <p className="mt-1 text-sm text-[#6b7280]">{description}</p>
        </div>
      </td>
    </tr>
  )
}

export default EmptyTableRow
