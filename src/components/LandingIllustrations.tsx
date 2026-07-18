// Ilustraciones propias de la landing, hechas a la medida de ContadorAmigo
// (panel financiero, recibos desordenados, negocio que crece), no clip-art genérico.

export function HeroIllustration() {
  return (
    <svg viewBox="0 0 480 440" className="w-full max-w-md" aria-hidden>
      <defs>
        <linearGradient id="hi-screen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.14" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.03" />
        </linearGradient>
      </defs>

      {/* halo de fondo */}
      <ellipse cx="245" cy="230" rx="190" ry="170" fill="var(--color-primary)" opacity="0.07" />

      {/* sombra de la tarjeta */}
      <rect x="82" y="76" width="300" height="272" rx="26" fill="var(--color-foreground)" opacity="0.06" />

      {/* tarjeta principal: panel de ContadorAmigo */}
      <g transform="rotate(-3 232 210)">
        <rect x="72" y="64" width="300" height="272" rx="26" fill="var(--color-card)" stroke="var(--color-border)" />
        {/* barra superior tipo app */}
        <rect x="72" y="64" width="300" height="46" rx="26" fill="url(#hi-screen)" />
        <circle cx="98" cy="87" r="5" fill="var(--color-primary)" opacity="0.5" />
        <rect x="118" y="82" width="86" height="10" rx="5" fill="var(--color-foreground)" opacity="0.35" />
        <rect x="316" y="80" width="34" height="14" rx="7" fill="var(--color-success)" opacity="0.25" />

        {/* utilidad del mes */}
        <rect x="98" y="130" width="150" height="14" rx="4" fill="var(--color-foreground)" opacity="0.15" />
        <rect x="98" y="150" width="110" height="22" rx="5" fill="var(--color-foreground)" opacity="0.75" />

        {/* barras del gráfico (mismo lenguaje visual que el Panel real) */}
        <rect x="98" y="270" width="34" height="46" rx="7" fill="var(--color-warning)" opacity="0.7" />
        <rect x="142" y="240" width="34" height="76" rx="7" fill="#e0574a" opacity="0.55" />
        <rect x="186" y="200" width="34" height="116" rx="7" fill="var(--color-success)" opacity="0.75" />
        <rect x="230" y="222" width="34" height="94" rx="7" fill="var(--color-primary)" opacity="0.85" />
        <rect x="274" y="188" width="34" height="128" rx="7" fill="var(--color-success)" />

        <line x1="90" y1="316" x2="336" y2="316" stroke="var(--color-border)" strokeWidth="1.5" />
      </g>

      {/* insignia: factura con IVA calculado */}
      <g transform="translate(20 240)">
        <rect width="118" height="72" rx="16" fill="var(--color-card)" stroke="var(--color-border)" />
        <circle cx="26" cy="26" r="14" fill="var(--color-success)" opacity="0.18" />
        <path d="M19 26 l5 5 l11 -11" fill="none" stroke="var(--color-success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="48" y="18" width="54" height="8" rx="4" fill="var(--color-foreground)" opacity="0.5" />
        <rect x="48" y="32" width="38" height="7" rx="3.5" fill="var(--color-foreground)" opacity="0.25" />
        <rect x="19" y="48" width="83" height="7" rx="3.5" fill="var(--color-foreground)" opacity="0.15" />
      </g>

      {/* insignia: moneda Bs */}
      <g transform="translate(352 44)">
        <circle cx="34" cy="34" r="34" fill="var(--color-primary)" />
        <circle cx="34" cy="34" r="34" fill="none" stroke="var(--color-card)" strokeWidth="3" />
        <text x="34" y="42" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--color-primary-foreground)" fontFamily="ui-serif, Georgia, serif" fontStyle="italic">
          Bs
        </text>
      </g>

      {/* maceta con planta creciendo: negocio que crece */}
      <g transform="translate(346 268)">
        <path d="M6 46 L58 46 L50 78 L14 78 Z" fill="var(--color-primary)" opacity="0.85" />
        <rect x="0" y="36" width="64" height="12" rx="6" fill="var(--color-primary)" />
        <path d="M32 36 C32 10 14 6 8 -8" fill="none" stroke="var(--color-success)" strokeWidth="5" strokeLinecap="round" />
        <path d="M32 36 C32 6 50 2 56 -14" fill="none" stroke="var(--color-success)" strokeWidth="5" strokeLinecap="round" />
        <path d="M32 36 C31 16 32 4 32 -18" fill="none" stroke="var(--color-success)" strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="8" cy="-10" rx="9" ry="6" fill="var(--color-success)" transform="rotate(-30 8 -10)" />
        <ellipse cx="56" cy="-16" rx="9" ry="6" fill="var(--color-success)" transform="rotate(25 56 -16)" />
        <ellipse cx="32" cy="-22" rx="8" ry="10" fill="var(--color-success)" opacity="0.9" />
      </g>

      {/* chispas decorativas */}
      <circle cx="60" cy="90" r="4" fill="var(--color-primary)" opacity="0.4" />
      <circle cx="410" cy="200" r="5" fill="var(--color-success)" opacity="0.4" />
      <circle cx="130" cy="60" r="3" fill="var(--color-primary)" opacity="0.5" />
    </svg>
  );
}

export function MessyBooksIllustration() {
  return (
    <svg viewBox="0 0 240 220" className="mx-auto w-full max-w-[220px]" aria-hidden>
      {/* pila de papeles/recibos desordenados */}
      <g transform="translate(20 30) rotate(-8 90 80)">
        <rect x="0" y="30" width="150" height="110" rx="8" fill="var(--color-card)" stroke="var(--color-border)" />
        <line x1="16" y1="55" x2="120" y2="55" stroke="var(--color-foreground)" opacity="0.25" strokeWidth="4" strokeLinecap="round" />
        <line x1="16" y1="72" x2="134" y2="72" stroke="var(--color-foreground)" opacity="0.18" strokeWidth="4" strokeLinecap="round" />
        <line x1="16" y1="89" x2="100" y2="89" stroke="var(--color-foreground)" opacity="0.18" strokeWidth="4" strokeLinecap="round" />
        <line x1="16" y1="106" x2="126" y2="106" stroke="var(--color-foreground)" opacity="0.18" strokeWidth="4" strokeLinecap="round" />
      </g>
      <g transform="translate(60 10) rotate(10 90 80)">
        <rect x="0" y="30" width="140" height="100" rx="8" fill="var(--color-card)" stroke="var(--color-border)" />
        <line x1="16" y1="52" x2="112" y2="52" stroke="var(--color-foreground)" opacity="0.22" strokeWidth="4" strokeLinecap="round" />
        <line x1="16" y1="68" x2="124" y2="68" stroke="var(--color-foreground)" opacity="0.16" strokeWidth="4" strokeLinecap="round" />
      </g>
      {/* nube de interrogación */}
      <g transform="translate(150 110)">
        <circle r="26" fill="var(--color-destructive)" opacity="0.12" />
        <text x="0" y="9" textAnchor="middle" fontSize="26" fontWeight="700" fill="var(--color-destructive)" fontFamily="ui-serif, Georgia, serif">
          ?
        </text>
      </g>
    </svg>
  );
}

export function SproutBadge({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path d="M8 52 L56 52 L50 60 L14 60 Z" fill="var(--color-primary)" opacity="0.85" />
      <rect x="4" y="44" width="56" height="10" rx="5" fill="var(--color-primary)" />
      <path d="M32 44 C32 22 18 18 12 6" fill="none" stroke="var(--color-success)" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M32 44 C32 20 46 16 52 4" fill="none" stroke="var(--color-success)" strokeWidth="4.5" strokeLinecap="round" />
      <ellipse cx="12" cy="8" rx="7" ry="5" fill="var(--color-success)" transform="rotate(-30 12 8)" />
      <ellipse cx="52" cy="6" rx="7" ry="5" fill="var(--color-success)" transform="rotate(25 52 6)" />
      <ellipse cx="32" cy="16" rx="7" ry="9" fill="var(--color-success)" />
    </svg>
  );
}
