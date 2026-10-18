/** A sprout above the soil line, roots below, one root marked: the gap Taproot finds. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <path d="M16 15.5V7.5" stroke="var(--leaf)" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M15.8 10.4c-1.1-3-4.1-4.6-7.3-4.1.2 3.2 2.8 5.2 7.3 4.1z" fill="var(--leaf)" />
      <path d="M16.2 8.9c1.2-2.9 4-4.2 6.9-3.5-.3 2.9-2.8 4.8-6.9 3.5z" fill="var(--leaf)" />
      <path d="M3.5 15.5h25" stroke="var(--soil)" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M16 15.5v6.2c0 2.6-1.1 4.6-3.2 6.1" stroke="var(--soil)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M16 18.6c2.1.5 3.9 1.9 5 4.2" stroke="var(--soil)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M15.9 21.4c-2.4.3-4.5 1.2-6.4 3" stroke="var(--soil)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <circle cx="21.4" cy="23.4" r="2.1" fill="var(--sun)" />
    </svg>
  );
}
