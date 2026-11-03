'use client';

import { useId, type ChangeEventHandler } from 'react';
import { Button } from './Button';
import { TextField } from './TextField';
import { cx } from './util';

export interface ProofUploadProps {
  state?: 'empty' | 'selected' | 'uploading' | 'error';
  fileName?: string;
  error?: string;
  onFileSelect?: (file: File | undefined) => void;
  referenceNote?: string;
  onReferenceChange?: ChangeEventHandler<HTMLInputElement>;
  /** Hide the reference-number field (required in v1; hide only if collected elsewhere). */
  showReference?: boolean;
  referenceHint?: string;
  /** e.g. "Enter the reference number from your receipt." */
  referenceError?: string;
  onSubmit?: () => void;
  id?: string;
  className?: string;
}

/** Receipt upload with the required reference number (TDD §9.3, §7.3). */
export function ProofUpload({ state = 'empty', fileName, error, onFileSelect, referenceNote, onReferenceChange, showReference = true,
  referenceHint, referenceError, onSubmit, id: idProp, className }: ProofUploadProps) {
  const autoId = useId();
  const id = idProp || autoId;
  const busy = state === 'uploading';
  const errId = `${id}-err`;
  const hasErr = state === 'error' && !!error;
  const missingRef = referenceNote !== undefined && !String(referenceNote).trim();
  return (
    <div className={cx('ss-upload', `ss-upload--${state}`, className)}>
      <label className="ss-upload__zone" htmlFor={id}>
        <span className="ss-upload__title">{fileName || 'Upload your payment receipt'}</span>
        <span className="ss-upload__hint">
          {fileName ? 'Tap to choose a different file' : 'Tap to choose a screenshot or PDF (JPG, PNG, HEIC or PDF, up to 8 MB)'}
        </span>
        <input id={id} type="file" className="ss-upload__input" accept="image/jpeg,image/png,image/heic,application/pdf"
          disabled={busy} aria-invalid={hasErr || undefined} aria-describedby={hasErr ? errId : undefined}
          onChange={(e) => onFileSelect?.(e.target.files?.[0])} />
      </label>
      {hasErr ? <p id={errId} className="ss-field__error" role="alert">{error}</p> : null}
      {showReference ? (
        <TextField label="Reference number" required autoComplete="off"
          hint={referenceHint || 'On your receipt. GCash: “Ref No.” under the amount. Bank apps: “Reference no.” or “Transaction ID”.'}
          error={referenceError} value={referenceNote} onChange={onReferenceChange} disabled={busy} />
      ) : null}
      <Button variant="primary" block disabled={busy || state === 'error' || !fileName || missingRef} onClick={onSubmit}>
        {busy ? 'Uploading…' : 'Send receipt'}
      </Button>
    </div>
  );
}
