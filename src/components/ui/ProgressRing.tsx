interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  label: string;
  children?: React.ReactNode;
}

const STROKE = 10;

/** A circular meter. The centre holds whatever you pass in as children. */
export function ProgressRing({ value, max, size = 112, label, children }: ProgressRingProps) {
  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = max === 0 ? 0 : Math.min(1, value / max);
  const isFull = ratio >= 1;

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--paper-deep)" strokeWidth={STROKE} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isFull ? "var(--leaf)" : "var(--seal)"}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          style={{ transition: "stroke-dashoffset 900ms var(--ease-out-expo), stroke 300ms" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}
