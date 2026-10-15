import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  htmlFor?: string
  className?: string
  children: ReactNode
}

function FormField({ label, htmlFor, className = '', children }: FormFieldProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={`grid gap-1 text-sm font-medium ${className}`}
    >
      {label}
      {children}
    </label>
  )
}

export default FormField
