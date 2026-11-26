// Input checks shared by the order form (in the browser) and the API (on the server).

/** Philippine mobile: 09XXXXXXXXX, 639XXXXXXXXX or +639XXXXXXXXX, spaces and dashes allowed. Returns +639XXXXXXXXX. */
export function normalizePhMobile(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, '');
  const m = /^(?:\+?63|0)(9\d{9})$/.exec(digits);
  return m ? `+63${m[1]}` : null;
}

/** Reference numbers are typed with spaces as printed on receipts; store letters and digits only. */
export function normalizeReference(input: string): string | null {
  const ref = input.replace(/[\s-]/g, '');
  return /^[A-Za-z0-9]{6,30}$/.test(ref) ? ref.toUpperCase() : null;
}

export function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.trim());
}

export interface OrderDetails {
  name: string;
  email: string;
  phone: string;
  note: string;
}

/** Field errors for the order form's "Your details" step (TDD §9.2), in the customer's words. */
export function validateOrderDetails(d: OrderDetails): Partial<Record<keyof OrderDetails, string>> {
  const errors: Partial<Record<keyof OrderDetails, string>> = {};
  if (!d.name.trim()) errors.name = 'Enter your name, so we know whose box it is.';
  else if (d.name.trim().length > 80) errors.name = 'Keep your name under 80 characters.';
  if (!isValidEmail(d.email)) errors.email = 'Enter an email address like maria@example.com.';
  if (!normalizePhMobile(d.phone)) errors.phone = 'Enter a Philippine mobile number, like 0917 123 4567.';
  if (d.note.length > 500) errors.note = 'Keep the note under 500 characters.';
  return errors;
}
