interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <input
      type="text"
      placeholder="Search attendee..."
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

export default SearchBar