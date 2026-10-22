"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { signIn, signUp } from "@/app/login/actions";
import { INITIAL_AUTH_STATE, type AuthField } from "@/lib/auth/form-state";

type Mode = "signup" | "signin";

const COPY: Record<Mode, { kicker: string; title: string; blurb: string; cta: string; pending: string }> = {
  signup: {
    kicker: "Free account",
    title: "Plant your grove",
    blurb: "Create an account and your progress, streak and level follow you to every device.",
    cta: "Create my account",
    pending: "Planting…",
  },
  signin: {
    kicker: "Welcome back",
    title: "Sign in",
    blurb: "Pick up your streak right where you left off.",
    cta: "Sign in",
    pending: "Signing in…",
  },
};

const inputClass =
  "mt-1.5 w-full rounded-2xl border border-line bg-paper px-4 py-3 text-base text-ink placeholder:text-ink-soft/60 aria-[invalid=true]:border-seal";

export function AuthForm() {
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>(params.get("mode") === "signin" ? "signin" : "signup");
  const next = params.get("next") ?? "";
  const copy = COPY[mode];

  return (
    <section aria-labelledby="auth-title" className="rise mx-auto max-w-md pt-4">
      <div className="relative overflow-hidden rounded-[2rem] border border-line bg-card p-6 shadow-[var(--shadow-lift)] sm:p-9">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-3 -top-8 select-none font-hanzi text-[9rem] font-black leading-none text-leaf/25"
        >
          林
        </span>
        <p className="relative text-xs font-bold uppercase tracking-[0.22em] text-seal">{copy.kicker}</p>
        <h1 id="auth-title" className="relative mt-2 font-display text-4xl font-semibold tracking-tight">
          {copy.title}
        </h1>
        <p className="relative mt-2 text-ink-soft">{copy.blurb}</p>

        <CredentialsForm key={mode} mode={mode} next={next} />

        <p className="mt-6 text-center text-sm text-ink-soft">
          {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="font-bold text-bamboo-deep underline decoration-leaf decoration-2 underline-offset-4"
          >
            {mode === "signup" ? "Sign in" : "Create an account"}
          </button>
        </p>
      </div>
      <p className="mt-5 text-center text-sm text-ink-soft">
        <Link href="/" className="underline underline-offset-4">
          ← Back to the grove
        </Link>
      </p>
    </section>
  );
}

function CredentialsForm({ mode, next }: { mode: Mode; next: string }) {
  const [state, action, isPending] = useActionState(mode === "signup" ? signUp : signIn, INITIAL_AUTH_STATE);
  const copy = COPY[mode];
  const errorOf = (field: AuthField) => state.fieldErrors[field];
  const isRedirecting = state.redirectTo !== null;

  // A full page load (not a client-side redirect) so the browser's Supabase client picks up
  // the session cookie the server just set.
  useEffect(() => {
    if (state.redirectTo) window.location.assign(state.redirectTo);
  }, [state.redirectTo]);

  return (
    <form action={action} noValidate className="relative mt-7 grid gap-4">
      <input type="hidden" name="next" value={next} />

      {mode === "signup" && (
        <Field id="displayName" label="What should we call you?" optional error={errorOf("displayName")}>
          <input
            id="displayName"
            name="displayName"
            type="text"
            autoComplete="nickname"
            maxLength={40}
            defaultValue={state.values.displayName}
            aria-invalid={Boolean(errorOf("displayName"))}
            aria-describedby={errorOf("displayName") ? "displayName-error" : undefined}
            className={inputClass}
            placeholder="Mei"
          />
        </Field>
      )}

      <Field id="email" label="Email" error={errorOf("email")}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.values.email}
          aria-invalid={Boolean(errorOf("email"))}
          aria-describedby={errorOf("email") ? "email-error" : undefined}
          className={inputClass}
          placeholder="you@example.com"
        />
      </Field>

      <Field
        id="password"
        label="Password"
        hint={mode === "signup" ? "At least 8 characters." : undefined}
        error={errorOf("password")}
      >
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
          minLength={mode === "signup" ? 8 : undefined}
          maxLength={72}
          aria-invalid={Boolean(errorOf("password"))}
          aria-describedby={errorOf("password") ? "password-error" : mode === "signup" ? "password-hint" : undefined}
          className={inputClass}
        />
      </Field>

      <div aria-live="polite">
        {state.error && (
          <p role="alert" className="rounded-2xl bg-seal/12 px-4 py-3 text-sm font-semibold text-seal-deep">
            {state.error}
          </p>
        )}
        {state.notice && (
          <p role="status" className="rounded-2xl bg-leaf/30 px-4 py-3 text-sm font-semibold text-bamboo-deep">
            {state.notice}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending || isRedirecting}
        className="press rounded-2xl bg-seal px-6 py-4 font-display text-xl font-semibold text-card disabled:opacity-70"
        style={{ "--press-edge": "var(--seal-deep)" } as React.CSSProperties}
      >
        {isRedirecting ? "Opening your grove…" : isPending ? copy.pending : `${copy.cta} →`}
      </button>
    </form>
  );
}

interface FieldProps {
  id: AuthField;
  label: string;
  optional?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ id, label, optional, hint, error, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-bold">
        {label}
        {optional && <span className="ml-1.5 font-medium text-ink-soft">(optional)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-semibold text-seal-deep">
          {error}
        </p>
      )}
    </div>
  );
}
