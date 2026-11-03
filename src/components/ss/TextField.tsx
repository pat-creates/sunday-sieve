import { useId, type ChangeEventHandler, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cx } from './util';

type FieldAttrs = InputHTMLAttributes<HTMLInputElement> & TextareaHTMLAttributes<HTMLTextAreaElement>;

export interface TextFieldProps extends Omit<FieldAttrs, 'className' | 'onChange'> {
  /** Typed for whichever element renders: an input, or a textarea when `multiline`. */
  onChange?: ChangeEventHandler<HTMLInputElement> | ChangeEventHandler<HTMLTextAreaElement>;
  label: string;
  hint?: string;
  error?: string;
  /** Renders a textarea (customer note). */
  multiline?: boolean;
  /** Adds "(optional)" to the label. */
  optional?: boolean;
  className?: string;
}

export function TextField({ label, hint, error, multiline, optional, className, id: idProp, onChange, ...rest }: TextFieldProps) {
  const autoId = useId();
  const id = idProp || autoId;
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const describedBy = [hint && hintId, error && errId].filter(Boolean).join(' ') || undefined;
  const common = { id, className: 'ss-field__input', 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy };
  return (
    <div className={cx('ss-field', error && 'ss-field--error', className)}>
      <label className="ss-field__label" htmlFor={id}>
        {label}
        {optional ? <span className="ss-field__opt"> (optional)</span> : null}
      </label>
      {hint ? <p id={hintId} className="ss-field__hint">{hint}</p> : null}
      {multiline
        ? <textarea {...common} rows={3} {...rest} onChange={onChange as ChangeEventHandler<HTMLTextAreaElement>} />
        : <input {...common} {...rest} onChange={onChange as ChangeEventHandler<HTMLInputElement>} />}
      {error ? <p id={errId} className="ss-field__error">{error}</p> : null}
    </div>
  );
}
