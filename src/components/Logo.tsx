// Logo vectorial de ContadorAmigo: círculo con degradado primario→acento y barras
// de gráfico dentro. Se usa en toda la app (landing, panel, login, registro).

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="lm-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="100%" stopColor="var(--color-accent)" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill="url(#lm-grad)" />
      <rect x="17" y="34" width="8" height="14" rx="2.5" fill="var(--color-primary-foreground)" opacity="0.55" />
      <rect x="28" y="26" width="8" height="22" rx="2.5" fill="var(--color-primary-foreground)" opacity="0.8" />
      <rect x="39" y="17" width="8" height="31" rx="2.5" fill="var(--color-primary-foreground)" />
    </svg>
  );
}
