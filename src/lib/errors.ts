import { NextResponse } from 'next/server';

/** Error with an HTTP status and a stable code: `{ error: { code, message, details? } }` (TDD §11). */
export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function errorResponse(err: unknown) {
  if (err instanceof AppError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) } },
      { status: err.status },
    );
  }
  // An illegal transition that got past the API is caught by the trigger (TDD §6.3).
  if (err instanceof Error && /illegal transition|cancel window|can be reinstated/.test(err.message)) {
    return NextResponse.json({ error: { code: 'CONFLICT', message: 'That change isn’t allowed for this order.' } }, { status: 409 });
  }
  console.error(err);
  return NextResponse.json({ error: { code: 'INTERNAL', message: 'Something went wrong. Please try again.' } }, { status: 500 });
}
