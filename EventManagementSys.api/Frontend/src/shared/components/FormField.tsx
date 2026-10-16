import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  className?: string;
  required?: boolean;
  children: ReactNode;
}

function FormField({ label, htmlFor, className = '', required = false, children }: FormFieldProps) {
  const generatedId = useId();
  const controlId = htmlFor ?? generatedId;
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<{ id?: string }>, {
        id: (children as ReactElement<{ id?: string }>).props.id ?? controlId,
      })
    : children;

  return (
    <div className={`grid gap-1 text-sm font-medium ${className}`}>
      <label htmlFor={controlId}>
        {label}
        {required && (
          <span className="ml-1 text-red-600" aria-label="required">
            *
          </span>
        )}
      </label>
      {control}
    </div>
  );
}

export default FormField;
