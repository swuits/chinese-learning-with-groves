import { CATEGORY_META } from "@/lib/vocab/types";
import type { CategoryStat } from "@/lib/progress/selectors";

interface GroveProps {
  stats: readonly CategoryStat[];
}

const STALK_WIDTH = 34;
const GAP = 38;
const BASE_HEIGHT = 80;
const MAX_EXTRA = 120;

/** One bamboo stalk per topic. The more words you master, the taller it grows. */
export function Grove({ stats }: GroveProps) {
  const width = stats.length * (STALK_WIDTH + GAP) + GAP;
  const height = BASE_HEIGHT + MAX_EXTRA + 50;

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Your grove: ${stats
          .map((s) => `${CATEGORY_META[s.category].label} ${s.mastered} of ${s.total} mastered`)
          .join(", ")}`}
        className="h-auto w-full"
      >
        <defs>
          <linearGradient id="stalk" x1="0" x2="1">
            <stop offset="0" stopColor="var(--bamboo-deep)" />
            <stop offset="0.45" stopColor="var(--leaf)" />
            <stop offset="1" stopColor="var(--bamboo)" />
          </linearGradient>
        </defs>
        <ellipse cx={width / 2} cy={height - 18} rx={width / 2 - 8} ry="12" fill="var(--paper-deep)" />

        {stats.map((stat, index) => {
          const stalkHeight = BASE_HEIGHT + stat.ratio * MAX_EXTRA;
          const x = GAP + index * (STALK_WIDTH + GAP);
          const baseY = height - 22;
          const joints = Math.max(1, Math.round(stalkHeight / 38));
          const leaves = Math.round(stat.ratio * 4);

          return (
            <g key={stat.category} className="sway" style={{ "--i": index } as React.CSSProperties}>
              <g className="grow" style={{ "--i": index } as React.CSSProperties}>
                <rect
                  x={x}
                  y={baseY - stalkHeight}
                  width={STALK_WIDTH}
                  height={stalkHeight}
                  rx="8"
                  fill="url(#stalk)"
                />
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
                  const ly = baseY - stalkHeight + 14 + l * 20;
                  const lx = x + STALK_WIDTH / 2;
                  return (
                    <path
                      key={l}
                      d={`M${lx} ${ly} q${side * 34} -22 ${side * 52} 2 q${side * -26} 14 ${side * -52} -2z`}
                      fill="var(--leaf)"
                      stroke="var(--bamboo)"
                      strokeWidth="1"
                    />
                  );
                })}
              </g>
              <text
                x={x + STALK_WIDTH / 2}
                y={height - 3}
                textAnchor="middle"
                fontSize="15"
                aria-hidden
              >
                {CATEGORY_META[stat.category].emoji}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
