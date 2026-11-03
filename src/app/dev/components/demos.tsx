'use client';

// Interactive demos for the component preview page: the parts that need state.
import { useState } from 'react';
import { BoxSizeCard, OrderSummary, ProofUpload, TextField, formatPeso } from '@/components/ss';
import { sampleProducts } from './samples';

export function OrderBuilderDemo() {
  const MAX = 24;
  const LEFT = 36;
  const [qty, setQty] = useState<Record<string, number>>({ picnic: 2 });
  const totalTarts = sampleProducts.reduce((t, p) => t + (qty[p.key] ?? 0) * p.tartCount, 0);
  const total = sampleProducts.reduce((t, p) => t + (qty[p.key] ?? 0) * p.priceCentavos, 0);
  const cap = Math.min(MAX, LEFT);
  const items = sampleProducts
    .filter((p) => (qty[p.key] ?? 0) > 0)
    .map((p) => ({ name: `${p.name} (${p.subtitle})`, quantity: qty[p.key], lineTotal: formatPeso(qty[p.key] * p.priceCentavos) }));
  return (
    <div className="demo-stack">
      {sampleProducts.map((p) => {
        const others = totalTarts - (qty[p.key] ?? 0) * p.tartCount;
        return (
          <BoxSizeCard key={p.key} layout="row" name={p.name} subtitle={p.subtitle} tartCount={p.tartCount}
            price={formatPeso(p.priceCentavos)} quantity={qty[p.key] ?? 0}
            max={Math.floor((cap - others) / p.tartCount)}
            onQuantityChange={(v) => setQty((q) => ({ ...q, [p.key]: v }))} />
        );
      })}
      <OrderSummary title="Order summary" items={items} totalTarts={totalTarts} total={formatPeso(total)}
        maxTarts={MAX} deadline="Tuesday, 11 August, 8:15 PM" />
    </div>
  );
}

export function ProofUploadDemo() {
  const [fileName, setFileName] = useState('');
  const [ref, setRef] = useState('');
  const [state, setState] = useState<'empty' | 'selected' | 'uploading' | 'error'>('empty');
  const [error, setError] = useState('');
  return (
    <ProofUpload
      state={state}
      fileName={fileName}
      error={error}
      referenceNote={ref}
      onReferenceChange={(e) => setRef(e.target.value)}
      onFileSelect={(f) => {
        if (f && f.size > 8 * 1024 * 1024) {
          setFileName(f.name);
          setError('That file is over 8 MB. Try a screenshot instead of a photo.');
          setState('error');
          return;
        }
        setError('');
        setFileName(f?.name ?? '');
        setState(f ? 'selected' : 'empty');
      }}
      onSubmit={() => {
        setState('uploading');
        setTimeout(() => setState('selected'), 1500);
      }}
    />
  );
}

export function TextFieldDemo() {
  const [phone, setPhone] = useState('0917 123');
  const valid = /^(?:\+?63|0)9\d{9}$/.test(phone.replace(/[\s-]/g, ''));
  return (
    <TextField label="Mobile number" type="tel" autoComplete="tel" value={phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
      hint="We only call or text if something goes wrong. Format: 0917 123 4567"
      error={valid ? undefined : 'Enter a Philippine mobile number, like 0917 123 4567.'} />
  );
}
