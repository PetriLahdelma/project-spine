/**
 * The hero wordmark. Bold rounded serif (Fraunces 900 SOFT-axis) in pink,
 * with a long diagonal shadow that frames a starfield. Rendered as inline
 * SVG so the shadow silhouette can mask a starfield <pattern>.
 *
 * The shadow is built as 120 stacked copies of the letterform offset along
 * a 45-degree vector; each copy is 1.2px apart so they fuse into a solid
 * silhouette that a clipPath can use to window the starfield.
 */

const SHADOW_STEPS = 120; // how many stacked copies form the shadow body
const STEP = 1.1;          // x/y offset between copies

function stars(seed: number) {
  // Deterministic PRNG so the starfield stays stable across renders.
  let s = seed;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const out: Array<{ x: number; y: number; r: number; o: number }> = [];
  for (let i = 0; i < 180; i++) {
    out.push({
      x: rnd() * 1400,
      y: rnd() * 900,
      r: 0.35 + rnd() * 1.1,
      o: 0.35 + rnd() * 0.6,
    });
  }
  return out;
}

type Props = {
  /** Line one of the wordmark. */
  line1: string;
  /** Line two of the wordmark. */
  line2?: string;
};

export function HeroWordmark({ line1, line2 }: Props) {
  const dots = stars(42);

  // Two-line layout. Line one at y=360, line two at y=680 (if present).
  const lines = line2 ? [line1, line2] : [line1];
  const linePositions = line2 ? [{ y: 360 }, { y: 680 }] : [{ y: 470 }];

  return (
    <svg
      className="hero-wordmark"
      viewBox="0 0 1400 900"
      preserveAspectRatio="xMidYMid meet"
      aria-label={lines.join(" ")}
      role="img"
    >
      <defs>
        {/* Shadow silhouette: stacked copies of the text = solid shape */}
        <clipPath id="hw-shadow-clip" clipPathUnits="userSpaceOnUse">
          {Array.from({ length: SHADOW_STEPS }).map((_, i) =>
            lines.map((line, li) => (
              <text
                key={`${li}-${i}`}
                x={700 + i * STEP}
                y={linePositions[li]!.y + i * STEP}
                textAnchor="middle"
                fontFamily="var(--font-display), Georgia, serif"
                fontWeight={900}
                fontSize={290}
                fontStyle="italic"
                letterSpacing={-6}
              >
                {line}
              </text>
            )),
          )}
        </clipPath>
      </defs>

      {/* 1. Solid black shadow layer (creates the silhouette) */}
      {Array.from({ length: SHADOW_STEPS }).map((_, i) =>
        lines.map((line, li) => (
          <text
            key={`sh-${li}-${i}`}
            x={700 + i * STEP}
            y={linePositions[li]!.y + i * STEP}
            textAnchor="middle"
            fontFamily="var(--font-display), Georgia, serif"
            fontWeight={900}
            fontSize={290}
            fontStyle="italic"
            letterSpacing={-6}
            fill="#0a0f1a"
          >
            {line}
          </text>
        )),
      )}

      {/* 2. Starfield painted only where the shadow silhouette is */}
      <g clipPath="url(#hw-shadow-clip)">
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#ffffff" opacity={d.o} />
        ))}
      </g>

      {/* 3. Pink letters on top */}
      {lines.map((line, li) => (
        <text
          key={`top-${li}`}
          x={700}
          y={linePositions[li]!.y}
          textAnchor="middle"
          fontFamily="var(--font-display), Georgia, serif"
          fontWeight={900}
          fontSize={290}
          fontStyle="italic"
          letterSpacing={-6}
          fill="#ff79de"
          stroke="#0a0f1a"
          strokeWidth={3}
          paintOrder="stroke"
        >
          {line}
        </text>
      ))}
    </svg>
  );
}
