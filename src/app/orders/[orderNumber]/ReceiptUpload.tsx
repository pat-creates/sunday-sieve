'use client';

// Receipt upload on the order page (TDD §9.3). Checks type and size in the browser before
// anything is sent; the server checks again by sniffing the file (TDD §7.3).
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProofUpload } from '@/components/ss';
import { normalizeReference } from '@/lib/validation';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'application/pdf'];
const MAX_BYTES = 8 * 1024 * 1024;

/** Until uploads are wired up, a valid receipt opens this sample "verifying" page. */
export function ReceiptUpload({ sampleNextHref }: { sampleNextHref: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File>();
  const [fileError, setFileError] = useState<string>();
  const [reference, setReference] = useState('');
  const [referenceError, setReferenceError] = useState<string>();
  const [uploading, setUploading] = useState(false);

  function pick(f: File | undefined) {
    setFile(f);
    if (!f) return setFileError(undefined);
    // iPhones sometimes leave HEIC files without a type, so fall back to the extension.
    const heicByName = !f.type && /\.(heic|heif)$/i.test(f.name);
    if (!ACCEPTED.includes(f.type) && !heicByName) setFileError('That file type won’t work. Upload a JPG, PNG, HEIC or PDF.');
    else if (f.size > MAX_BYTES) setFileError('That file is over 8 MB. Try a screenshot instead of a photo.');
    else setFileError(undefined);
  }

  function submit() {
    if (!normalizeReference(reference)) {
      setReferenceError('Enter the reference number from your receipt: 6 to 30 letters and numbers.');
      return;
    }
    setReferenceError(undefined);
    setUploading(true);
    setTimeout(() => router.push(sampleNextHref), 900);
  }

  return (
    <ProofUpload
      state={uploading ? 'uploading' : fileError ? 'error' : file ? 'selected' : 'empty'}
      fileName={file?.name}
      error={fileError}
      onFileSelect={pick}
      referenceNote={reference}
      onReferenceChange={(e) => { setReference(e.target.value); if (referenceError) setReferenceError(undefined); }}
      referenceError={referenceError}
      onSubmit={submit}
    />
  );
}
