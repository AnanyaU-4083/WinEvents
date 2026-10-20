// Explain when no results exist.
interface EmptyTableRowProps {
  colSpan: number;
  title: string;
  description: string;
}

function EmptyTableRow({ colSpan, title, description }: EmptyTableRowProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10">
        <div className="text-center">
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
          <p className="mt-1 text-sm text-text-muted">{description}</p>
        </div>
      </td>
    </tr>
  );
}

export default EmptyTableRow;
