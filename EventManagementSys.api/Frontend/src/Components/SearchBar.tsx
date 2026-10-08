interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
}: SearchBarProps) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(event) =>
        onChange(event.target.value)
      }
      className="w-full rounded-lg border border-[#dfe5ec] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/20"
    />
  )
}

export default SearchBar