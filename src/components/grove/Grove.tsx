export interface GroveStalk {
  key: string;
  label: string;
  mastered: number;
  total: number;
  ratio: number;
  /** Words mastered since the round began; shown as a "+N" badge above the stalk. */
  gain?: number;
}

interface GroveProps {
  stalks: readonly GroveStalk[];
}

const STALK_WIDTH = 46;
const GAP = 62;
const BASE_HEIGHT = 80;
const MAX_EXTRA = 130;
const MAX_LEAVES = 4;

/**
 * One bamboo stalk per level. Height follows the square root of progress, so the first words
 * you master visibly lift a stalk instead of crawling up by a pixel at a time.
 */
export function Grove({ stalks }: GroveProps) {
  const width = stalks.length * (STALK_WIDTH + GAP) + GAP;
  const height = BASE_HEIGHT + MAX_EXTRA + 56;

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Your grove: ${stalks.map((s) => `${s.label} ${s.mastered} of ${s.total} words mastered`).join(", ")}`}
        className="h-auto w-full"
      >
        <defs>
          <linearGradient id="stalk" x1="0" x2="1">
            <stop offset="0" stopColor="var(--bamboo-deep)" />
            <stop offset="0.45" stopColor="var(--leaf)" />
            <stop offset="1" stopColor="var(--bamboo)" />
          </linearGradient>
        </defs>
        <ellipse cx={width / 2} cy={height - 26} rx={width / 2 - 8} ry="12" fill="var(--paper-deep)" />

        {stalks.map((stalk, index) => {
          const growth = Math.sqrt(stalk.ratio);
          const stalkHeight = BASE_HEIGHT + growth * MAX_EXTRA;
          const x = GAP + index * (STALK_WIDTH + GAP);
          const baseY = height - 30;
          const joints = Math.max(1, Math.round(stalkHeight / 38));
          const leaves = Math.round(growth * MAX_LEAVES);
          const centerX = x + STALK_WIDTH / 2;

          return (
            <g key={stalk.key} className="sway" style={{ "--i": index } as React.CSSProperties}>
              <g className="grow" style={{ "--i": index } as React.CSSProperties}>
                <rect x={x} y={baseY - stalkHeight} width={STALK_WIDTH} height={stalkHeight} rx="9" fill="url(#stalk)" />
                {Array.from({ length: joints }, (_, j) => (
                  <rect
                    key={j}
                    x={x - 2}
                    y={baseY - ((j + 1) * stalkHeight) / (joints + 1)}
                    width={STALK_WIDTH + 4}
                    height="5"
                    rx="2.5"
                    fill="var(--bamboo-deep)"
                    opacity="0.55"
                  />
                ))}
                {Array.from({ length: leaves }, (_, l) => {
                  const side = l % 2 === 0 ? 1 : -1;
                  const leafY = baseY - stalkHeight + 14 + l * 20;
                  return (
                    <path
                      key={l}
                      d={`M${centerX} ${leafY} q${side * 38} -24 ${side * 58} 2 q${side * -28} 16 ${side * -58} -2z`}
                      fill="var(--leaf)"
                      stroke="var(--bamboo)"
                      strokeWidth="1"
                    />
                  );
                })}
              </g>
              {stalk.gain !== undefined && stalk.gain > 0 && (
                <g className="pop" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
                  <rect
                    x={centerX - 24}
                    y={Math.max(4, baseY - stalkHeight - 34)}
                    width="48"
                    height="24"
                    rx="12"
                    fill="var(--seal)"
                  />
                  <text
                    x={centerX}
                    y={Math.max(4, baseY - stalkHeight - 34) + 17}
                    textAnchor="middle"
                    fontSize="15"
                    fontWeight="800"
                    fill="var(--card)"
                  >
                    +{stalk.gain}
                  </text>
                </g>
              )}
              <text
                x={centerX}
                y={height - 6}
                textAnchor="middle"
                fontSize="17"
                fontWeight="700"
                fill="var(--ink-soft)"
                aria-hidden
              >
                {stalk.label}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
