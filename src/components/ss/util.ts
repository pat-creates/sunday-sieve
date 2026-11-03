// Shared helpers for the Sunday Sieve components (ported from the design system bundle).
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/** "h2" etc. from a heading level, falling back to `dflt` for anything out of range. */
export function headingTag(level: number | undefined, dflt: HeadingLevel): 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' {
  const l = level && level >= 1 && level <= 6 ? level : dflt;
  return `h${l}` as 'h1';
}
