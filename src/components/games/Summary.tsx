import Link from "next/link";
import { XP_PER_CORRECT } from "@/lib/progress/progress";

interface SummaryProps {
  correct: number;
  total: number;
  onAgain: () => void;
  extra?: string;
}

const verdict = (ratio: number): { title: string; emoji: string } => {
  if (ratio === 1) return { title: "Flawless!", emoji: "🏆" };
  if (ratio >= 0.7) return { title: "Nicely grown", emoji: "🌱" };
  if (ratio >= 0.4) return { title: "Good roots", emoji: "🌿" };
  return { title: "Every grove starts small", emoji: "🌰" };
};

export function Summary({ correct, total, onAgain, extra }: SummaryProps) {
  const { title, emoji } = verdict(total === 0 ? 0 : correct / total);

  return (
    <section aria-labelledby="summary-title" className="pop mx-auto max-w-lg pt-6 text-center">
      <div className="rounded-[2rem] border border-line bg-card p-8 shadow-[var(--shadow-lift)]">
        <div aria-hidden className="text-6xl">
          {emoji}
        </div>
        <h2 id="summary-title" className="mt-3 font-display text-4xl font-semibold">
          {title}
        </h2>
        <p className="mt-2 text-ink-soft">
          You got <strong className="text-ink">{correct}</strong> of <strong className="text-ink">{total}</strong>{" "}
          right
          {extra ? ` · ${extra}` : ""}
        </p>
        <p className="mt-4 inline-block rounded-full bg-gold/40 px-4 py-1.5 font-bold">
          +{correct * XP_PER_CORRECT} XP
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onAgain}
            className="press rounded-2xl bg-bamboo-deep px-6 py-3 font-display text-lg font-semibold text-card"
            style={{ "--press-edge": "var(--ink)" } as React.CSSProperties}
          >
            Play again
          </button>
          <Link
            href="/"
            className="press rounded-2xl border border-line bg-card px-6 py-3 font-display text-lg font-semibold"
          >
            Visit your grove
          </Link>
        </div>
      </div>
    </section>
  );
}
