/* eslint-disable @typescript-eslint/no-explicit-any -- components are looked up by name from two libraries */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as SS from '@/components/ss';

// The design system's own component bundle, copied from the Sunday Sieve design system.
// When the design system changes, replace this file and re-run: any drift in the port shows here.
const BUNDLE = path.join(__dirname, 'fixtures', 'design-system-bundle.js');
(globalThis as any).window = { React };
new Function(readFileSync(BUNDLE, 'utf8'))();
const DS = (globalThis as any).window.SundaySieve;

// useId values differ between trees; normalise them, and ignore attribute order/boolean spelling.
const norm = (html: string) => html
  .replace(/«[^»]*»|:r[0-9a-z]+:|_R_[0-9a-zA-Z_]+_/g, 'ID')
  .replace(/aria-invalid="true"/g, 'aria-invalid')
  .replace(/aria-pressed="(true|false)"/g, 'aria-pressed=$1');

const items = [{ name: 'The Picnic Pack (Box of 6)', quantity: 2, lineTotal: '₱630.00' }];
const methods = [{ provider: 'GCash', accountName: 'PA*****A N.', accountHint: '099• ••••507' }, { provider: 'BDO', accountName: 'Pat' }];
const panel = { bakeDate: 'Saturday, 15 August', pickupWindow: '3:00–7:00 PM', cutoff: 'Friday, 14 August at 6:00 PM', capacity: 96 };
const noop = () => {};

const cases: [string, any][] = [
  ['Button', { children: 'Go' }], ['Button', { variant: 'sun', size: 'lg', block: true, href: '/x', children: 'Order' }],
  ['Button', { href: '/x', disabled: true, children: 'Off' }],
  ...['AWAITING_PAYMENT','PAYMENT_UNDER_REVIEW','CONFIRMED','BAKING','READY_FOR_PICKUP','COMPLETED','CANCELLED'].map((s) => ['StatusBadge', { status: s }] as [string, any]),
  ['Notice', { tone: 'danger', title: 'T', children: 'body', action: 'act' }], ['Notice', { title: 'Only title' }],
  ['OrderNumber', { value: 'ET-7K3M-9QP2' }], ['OrderNumber', { value: 'ET-7K3M-9QP2', copyable: false }],
  ['CapacityIndicator', { remaining: 60 }], ['CapacityIndicator', { remaining: 12, inverse: true }], ['CapacityIndicator', { remaining: 0 }],
  ['BakeDayPanel', { state: 'open', ...panel, remaining: 36, note: 'Ube!', orderHref: '/order' }],
  ['BakeDayPanel', { state: 'soldout', ...panel, remaining: 0, followHref: '#fb' }],
  ['BakeDayPanel', { state: 'closed', ...panel, remaining: 14, reasonExtra: 'Next week!' }],
  ['BakeDayPanel', { state: 'none', followHref: '#fb', headingLevel: 3 }],
  ['BakeDayPanel', { state: 'none' }],
  ['BakeDayPanel', { state: 'open', ...panel, remaining: 12, orderHref: '/order' }],
  ['BakeDayPanel', { state: 'open', ...panel, remaining: 1, almostSoldOutAt: 6, orderHref: '/order' }],
  ['BakeDayPanel', { state: 'open', ...panel, remaining: 0, note: 'Ube!' }],
  ['BakeDayPanel', { state: 'closed', ...panel, remaining: 40, note: 'Ube!', followHref: '#fb', followLabel: 'Follow' }],
  ['CapacityIndicator', { remaining: 1 }],
  ['BakeDayPanel', { state: 'open', ...panel, remaining: 36, ctaLabel: 'Book now', orderHref: '/order' }],
  ['BakeDayBar', { state: 'open', bakeDate: 'Sat 5 Dec', cutoff: 'Fri 6 PM', remaining: 36, orderHref: '/order' }],
  ['BakeDayBar', { state: 'open', bakeDate: 'Sat 5 Dec', remaining: 12, orderHref: '/order', ctaLabel: 'Order for Sat' }],
  ['BakeDayBar', { state: 'soldout', bakeDate: 'Sat 5 Dec', remaining: 0, followHref: '#fb' }],
  ['BakeDayBar', { state: 'closed', bakeDate: 'Sat 5 Dec', remaining: 40 }],
  ['BakeDayBar', { state: 'none', followHref: '#fb', followLabel: 'Follow us' }],
  ['BoxSizeCard', { name: 'The Picnic Pack', subtitle: 'Box of 6', tartCount: 6, price: '₱315.00', href: '/order?box=6' }],
  ['BoxSizeCard', { name: 'The Picnic Pack', tartCount: 6, price: '₱315.00', href: '/order', linkLabel: 'Pick me' }],
  ['TextField', { label: 'Mobile', hint: 'Format: 0917 123 4567', error: 'Enter a number' }],
  ['PaymentCountdown', { state: 'running', compact: true, amount: '₱630.00', deadline: 'Tue', remainingText: '23h left' }],
  ['PaymentCountdown', { state: 'running', compact: true, deadline: 'Tue' }],
  ['PaymentMethodPicker', { methods, desktopTip: '' }],
  ['OrderProgress', { status: 'BAKING', title: 'Where your order is', headingLevel: 2 }],
  ['PickupDetails', { publicBlurb: 'Cainta, Rizal', title: '' }],
  ['PickupDetails', { revealed: true, fullAddress: 'Addr', title: 'Where to go' }],
  ['HowItWorks', {}], ['FaqItem', { question: 'Q?', children: 'A', defaultOpen: true }],
  ['QuantityStepper', { value: 2, max: 3, itemName: 'The Picnic Pack', onChange: noop }],
  ['BoxSizeCard', { name: 'The Picnic Pack', subtitle: 'Box of 6', tartCount: 6, price: '₱315.00' }],
  ['BoxSizeCard', { layout: 'row', name: 'The Picnic Pack', tartCount: 6, price: '₱315.00', quantity: 1, max: 4, onQuantityChange: noop, headingLevel: 2 }],
  ['TextField', { label: 'Email', hint: 'h', error: 'e', type: 'email' }], ['TextField', { label: 'Note', optional: true, multiline: true }],
  ['OrderSummary', { items: [], totalTarts: 0, total: '₱0.00' }], ['OrderSummary', { items, totalTarts: 12, total: '₱630.00', deadline: 'Tue' }],
  ['OrderSummary', { items, totalTarts: 36, total: '₱1.00', overLimitAction: 'msg' }],
  ['PaymentCountdown', { state: 'paused' }], ['PaymentCountdown', { state: 'expired', deadline: 'Tue' }],
  ['PaymentCountdown', { state: 'running', deadline: 'Tue', remainingText: '23h 14m left' }],
  ['PaymentQRCard', { provider: 'GCash', accountName: 'Pat', accountHint: '•••• 1', amount: '₱630.00' }],
  ['PaymentMethodPicker', { methods, amount: '₱630.00' }], ['PaymentMethodPicker', { methods, defaultValue: 'BDO', tip: '' }],
  ['ProofUpload', { state: 'empty' }], ['ProofUpload', { state: 'error', fileName: 'r.png', error: 'Too big', referenceNote: '' }],
  ['ProofUpload', { state: 'selected', fileName: 'r.png', referenceNote: '123456' }],
  ['OrderProgress', { status: 'PAYMENT_UNDER_REVIEW' }], ['OrderProgress', { status: 'COMPLETED' }], ['OrderProgress', { status: 'CANCELLED', reason: 'why' }],
  ['PickupDetails', { publicBlurb: 'Antipolo', pickupWindow: 'Sat' }],
  ['PickupDetails', { revealed: true, fullAddress: 'Addr', mapUrl: '#m', instructions: 'Ring', contactNumber: '0917 123 4567', pickupWindow: 'Sat' }],
];

describe('React port matches the design system bundle', () => {
  it.each(cases.map((c, i) => [`${c[0]} #${i}`, ...c]))('%s', (_label, name, props) => {
    const ours = norm(renderToStaticMarkup(React.createElement((SS as any)[name], props)));
    const theirs = norm(renderToStaticMarkup(React.createElement(DS[name], props)));
    expect(ours).toBe(theirs);
  });
  it('formatPeso', () => {
    for (const n of [0, 5, 31500, 123456789, -2500]) expect(SS.formatPeso(n)).toBe(DS.formatPeso(n));
  });
});
