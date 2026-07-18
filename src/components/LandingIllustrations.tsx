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

        {/* barras del gráfico (mismo lenguaje visual que el Panel real), crecen al aparecer */}
        <rect className="bar-grow" style={{ animationDelay: "0.5s" }} x="98" y="270" width="34" height="46" rx="7" fill="var(--color-warning)" opacity="0.7" />
        <rect className="bar-grow" style={{ animationDelay: "0.6s" }} x="142" y="240" width="34" height="76" rx="7" fill="#e0574a" opacity="0.55" />
        <rect className="bar-grow" style={{ animationDelay: "0.7s" }} x="186" y="200" width="34" height="116" rx="7" fill="var(--color-success)" opacity="0.75" />
        <rect className="bar-grow" style={{ animationDelay: "0.8s" }} x="230" y="222" width="34" height="94" rx="7" fill="var(--color-primary)" opacity="0.85" />
        <rect className="bar-grow" style={{ animationDelay: "0.9s" }} x="274" y="188" width="34" height="128" rx="7" fill="var(--color-success)" />

        <line x1="90" y1="316" x2="336" y2="316" stroke="var(--color-border)" strokeWidth="1.5" />
      </g>

      {/* insignia: factura con IVA calculado */}
      {/* nota: la posición (SVG transform) va en un <g> exterior y la animación (CSS
          transform) en uno interior — si se mezclan en el mismo <g>, el transform de la
          animación CSS pisa por completo el translate() posicional del SVG. */}
      <g transform="translate(20 240)">
        <g className="animate-pop" style={{ animationDelay: "1s" }}>
          <rect width="118" height="72" rx="16" fill="var(--color-card)" stroke="var(--color-border)" />
          <circle cx="26" cy="26" r="14" fill="var(--color-success)" opacity="0.18" />
          <path d="M19 26 l5 5 l11 -11" fill="none" stroke="var(--color-success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="48" y="18" width="54" height="8" rx="4" fill="var(--color-foreground)" opacity="0.5" />
          <rect x="48" y="32" width="38" height="7" rx="3.5" fill="var(--color-foreground)" opacity="0.25" />
          <rect x="19" y="48" width="83" height="7" rx="3.5" fill="var(--color-foreground)" opacity="0.15" />
        </g>
      </g>

      {/* insignia: moneda Bs, flota suavemente */}
      <g transform="translate(352 44)">
        <g className="animate-float">
          <circle cx="34" cy="34" r="34" fill="var(--color-primary)" />
          <circle cx="34" cy="34" r="34" fill="none" stroke="var(--color-card)" strokeWidth="3" />
          <text x="34" y="42" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--color-primary-foreground)" fontFamily="ui-serif, Georgia, serif" fontStyle="italic">
            Bs
          </text>
        </g>
      </g>

      {/* maceta con planta creciendo: negocio que crece, se mece */}
      <g transform="translate(346 268)">
        <g className="animate-sway">
          <path d="M6 46 L58 46 L50 78 L14 78 Z" fill="var(--color-primary)" opacity="0.85" />
          <rect x="0" y="36" width="64" height="12" rx="6" fill="var(--color-primary)" />
          <path d="M32 36 C32 10 14 6 8 -8" fill="none" stroke="var(--color-success)" strokeWidth="5" strokeLinecap="round" />
          <path d="M32 36 C32 6 50 2 56 -14" fill="none" stroke="var(--color-success)" strokeWidth="5" strokeLinecap="round" />
          <path d="M32 36 C31 16 32 4 32 -18" fill="none" stroke="var(--color-success)" strokeWidth="5" strokeLinecap="round" />
          <ellipse cx="8" cy="-10" rx="9" ry="6" fill="var(--color-success)" transform="rotate(-30 8 -10)" />
          <ellipse cx="56" cy="-16" rx="9" ry="6" fill="var(--color-success)" transform="rotate(25 56 -16)" />
          <ellipse cx="32" cy="-22" rx="8" ry="10" fill="var(--color-success)" opacity="0.9" />
        </g>
      </g>

      {/* chispas decorativas */}
      <circle className="animate-float" style={{ animationDelay: "0.3s" }} cx="60" cy="90" r="4" fill="var(--color-primary)" opacity="0.4" />
      <circle className="animate-float" style={{ animationDelay: "1.2s" }} cx="410" cy="200" r="5" fill="var(--color-success)" opacity="0.4" />
      <circle className="animate-float" style={{ animationDelay: "0.8s" }} cx="130" cy="60" r="3" fill="var(--color-primary)" opacity="0.5" />
    </svg>
  );
}

export function ReceiptIllustration() {
  return (
    <svg viewBox="0 0 120 120" className="size-14" aria-hidden>
      <path
        d="M28 12 h64 v92 l-10 -8 -10 8 -10 -8 -10 8 -10 -8 -10 8 -10 -8 -4 8 Z"
        fill="var(--color-primary)"
        opacity="0.12"
      />
      <path
        d="M28 12 h64 v92 l-10 -8 -10 8 -10 -8 -10 8 -10 -8 -10 8 -4 -8 Z"
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <line x1="42" y1="34" x2="78" y2="34" stroke="var(--color-primary)" strokeWidth="4" strokeLinecap="round" opacity="0.55" />
      <line x1="42" y1="48" x2="78" y2="48" stroke="var(--color-primary)" strokeWidth="4" strokeLinecap="round" opacity="0.35" />
      <line x1="42" y1="62" x2="64" y2="62" stroke="var(--color-primary)" strokeWidth="4" strokeLinecap="round" opacity="0.35" />
      <circle cx="86" cy="78" r="20" fill="var(--color-success)" />
      <path d="M77 78 l6 6 12 -13" fill="none" stroke="var(--color-success-foreground)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MagnifierChartIllustration() {
  return (
    <svg viewBox="0 0 120 120" className="size-14" aria-hidden>
      <rect x="18" y="70" width="14" height="30" rx="4" fill="var(--color-warning)" opacity="0.65" />
      <rect x="38" y="52" width="14" height="48" rx="4" fill="var(--color-success)" opacity="0.8" />
      <rect x="58" y="34" width="14" height="66" rx="4" fill="var(--color-primary)" />
      <circle cx="82" cy="42" r="26" fill="none" stroke="var(--color-primary)" strokeWidth="5" />
      <line x1="100" y1="60" x2="114" y2="74" stroke="var(--color-primary)" strokeWidth="6" strokeLinecap="round" />
      <path d="M70 46 l8 -10 6 6 12 -14" fill="none" stroke="var(--color-success)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ShopfrontsIllustration() {
  return (
    <svg viewBox="0 0 120 120" className="size-14" aria-hidden>
      <rect x="10" y="52" width="34" height="48" rx="4" fill="var(--color-primary)" opacity="0.85" />
      <path d="M6 52 L44 52 L40 34 L10 34 Z" fill="var(--color-warning)" />
      <rect x="20" y="72" width="14" height="28" fill="var(--color-card)" opacity="0.85" />

      <rect x="50" y="40" width="34" height="60" rx="4" fill="var(--color-success)" opacity="0.85" />
      <path d="M46 40 L84 40 L80 22 L50 22 Z" fill="var(--color-primary)" />
      <rect x="60" y="62" width="14" height="38" fill="var(--color-card)" opacity="0.85" />

      <rect x="88" y="58" width="26" height="42" rx="4" fill="var(--color-warning)" opacity="0.7" />
      <path d="M85 58 L114 58 L111 44 L89 44 Z" fill="var(--color-success)" />
    </svg>
  );
}

export function GrowthIllustration() {
  return (
    <svg viewBox="0 0 220 200" className="mx-auto w-full max-w-[220px]" aria-hidden>
      <ellipse cx="110" cy="176" rx="70" ry="10" fill="var(--color-foreground)" opacity="0.06" />
      <g className="animate-sway">
        <path d="M78 150 L146 150 L136 176 L88 176 Z" fill="var(--color-primary)" opacity="0.9" />
        <rect x="70" y="136" width="84" height="16" rx="8" fill="var(--color-primary)" />
        <path d="M112 136 C112 88 74 76 54 40" fill="none" stroke="var(--color-success)" strokeWidth="7" strokeLinecap="round" />
        <path d="M112 136 C112 84 156 68 174 30" fill="none" stroke="var(--color-success)" strokeWidth="7" strokeLinecap="round" />
        <path d="M112 136 C110 92 112 60 112 20" fill="none" stroke="var(--color-success)" strokeWidth="7" strokeLinecap="round" />
        <ellipse cx="54" cy="36" rx="15" ry="10" fill="var(--color-success)" transform="rotate(-25 54 36)" />
        <ellipse cx="174" cy="26" rx="15" ry="10" fill="var(--color-success)" transform="rotate(20 174 26)" />
        <ellipse cx="112" cy="16" rx="13" ry="17" fill="var(--color-success)" opacity="0.92" />
      </g>
      <g className="animate-float" style={{ animationDelay: "0.4s" }}>
        <circle cx="176" cy="120" r="18" fill="var(--color-primary)" />
        <text x="176" y="126" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--color-primary-foreground)" fontFamily="ui-serif, Georgia, serif" fontStyle="italic">
          Bs
        </text>
      </g>
    </svg>
  );
}

export function CompassIllustration() {
  return (
    <svg viewBox="0 0 160 160" className="w-full max-w-[150px]" aria-hidden>
      <circle cx="80" cy="80" r="64" fill="var(--color-card)" stroke="var(--color-border)" strokeWidth="2" />
      <circle cx="80" cy="80" r="50" fill="none" stroke="var(--color-primary)" strokeWidth="2" opacity="0.25" />
      <line x1="80" y1="20" x2="80" y2="32" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" />
      <line x1="80" y1="128" x2="80" y2="140" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      <line x1="20" y1="80" x2="32" y2="80" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      <line x1="128" y1="80" x2="140" y2="80" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      <g className="animate-sway" style={{ transformOrigin: "80px 80px" }}>
        <path d="M80 40 L92 80 L80 120 L68 80 Z" fill="var(--color-primary)" />
        <path d="M80 40 L92 80 L80 80 Z" fill="var(--color-primary)" />
        <path d="M80 120 L68 80 L80 80 Z" fill="var(--color-primary-foreground)" opacity="0.3" />
      </g>
      <circle cx="80" cy="80" r="6" fill="var(--color-card)" stroke="var(--color-primary)" strokeWidth="2" />
    </svg>
  );
}

export function PeakFlagIllustration() {
  return (
    <svg viewBox="0 0 220 170" className="w-full max-w-[220px]" aria-hidden>
      <circle cx="172" cy="38" r="20" fill="var(--color-accent)" opacity="0.55" />
      <path d="M20 150 L80 60 L112 100 L140 66 L200 150 Z" fill="var(--color-primary)" opacity="0.28" />
      <path d="M60 150 L118 44 L176 150 Z" fill="var(--color-primary)" opacity="0.9" />
      <path d="M118 44 L138 78 L98 78 Z" fill="var(--color-card)" opacity="0.9" />
      <path
        className="animate-float"
        d="M118 44 L118 16 L146 26 L118 36 Z"
        fill="var(--color-warning)"
        style={{ transformOrigin: "118px 44px" }}
      />
      <line x1="118" y1="16" x2="118" y2="44" stroke="var(--color-foreground)" strokeWidth="2.5" opacity="0.55" />
      <path d="M40 150 C64 118 88 108 118 108 C148 108 168 128 188 150" fill="none" stroke="var(--color-success)" strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

export function PathIllustration() {
  return (
    <svg viewBox="0 0 320 120" className="mx-auto w-full max-w-lg" aria-hidden>
      <path
        d="M12 96 C 70 96, 70 30, 118 30 S 166 96, 214 96 S 262 30, 308 30"
        fill="none"
        stroke="var(--color-border)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="1 14"
      />
      {[
        { x: 12, y: 96 },
        { x: 118, y: 30 },
        { x: 214, y: 96 },
        { x: 308, y: 30 },
      ].map((p, i) => (
        <g key={i} className="animate-pop" style={{ animationDelay: `${0.15 * i}s` }}>
          <circle cx={p.x} cy={p.y} r="11" fill={i === 3 ? "var(--color-success)" : "var(--color-primary)"} />
          <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--color-primary-foreground)">
            {i + 1}
          </text>
        </g>
      ))}
      <g transform="translate(308 12)">
        <line x1="0" y1="0" x2="0" y2="18" stroke="var(--color-foreground)" strokeWidth="2" opacity="0.5" />
        <path d="M0 0 L18 4 L0 9 Z" fill="var(--color-success)" />
      </g>
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
