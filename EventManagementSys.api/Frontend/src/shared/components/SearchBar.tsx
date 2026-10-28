// Capture text for local filtering.
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  ariaLabel?: string;
  placeholder?: string;
  fullWidth?: boolean;
}

function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  fullWidth = false,
  id,
  ariaLabel,
}: SearchBarProps) {
  return (
    <input
      id={id}
      aria-label={ariaLabel}
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`w-full rounded-lg border border-border-default bg-white px-3 py-2 text-sm text-text-primary outline-none transition placeholder:text-text-placeholder focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 ${fullWidth ? '' : 'md:max-w-xs'}`}
    />
  );
}

export default SearchBar;
