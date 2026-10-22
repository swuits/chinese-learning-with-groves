"use server";

import type { AuthError } from "@supabase/supabase-js";
import type { z } from "zod";
import { INITIAL_AUTH_STATE, type AuthField, type AuthFormState } from "@/lib/auth/form-state";
import { loginSchema, safeNextPath, signupSchema } from "@/lib/auth/schemas";
import { createClient } from "@/lib/supabase/server";

const readField = (formData: FormData, name: string): string => {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
};

const toFieldErrors = (issues: readonly z.core.$ZodIssue[]): AuthFormState["fieldErrors"] => {
  const errors: AuthFormState["fieldErrors"] = {};
  for (const issue of issues) {
    const field = issue.path[0] as AuthField | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
};

const fail = (patch: Partial<AuthFormState>, values: AuthFormState["values"]): AuthFormState => ({
  ...INITIAL_AUTH_STATE,
  ...patch,
  values,
});

const RATE_LIMITED = "Too many attempts. Please wait a minute and try again.";

const signUpMessage = (error: AuthError): string => {
  switch (error.code) {
    case "user_already_exists":
    case "email_exists":
      return "An account with that email already exists. Try signing in instead.";
    case "weak_password":
      return "That password is too easy to guess. Try a longer or less common one.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return RATE_LIMITED;
    case "signup_disabled":
      return "Sign-ups are paused right now. Please try again later.";
    default:
      return "We couldn't create your account. Please try again.";
  }
};

const signInMessage = (error: AuthError): string => {
  switch (error.code) {
    case "email_not_confirmed":
      return "Please confirm your email first. Check your inbox for the link.";
    case "over_request_rate_limit":
      return RATE_LIMITED;
    case "invalid_credentials":
      return "That email and password don't match.";
    default:
      return "We couldn't sign you in. Please try again.";
  }
};

export async function signUp(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const raw = {
    email: readField(formData, "email"),
    password: readField(formData, "password"),
    displayName: readField(formData, "displayName"),
  };
  const values = { email: raw.email.trim(), displayName: raw.displayName.trim() };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) return fail({ fieldErrors: toFieldErrors(parsed.error.issues) }, values);

  const { email, password, displayName } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: displayName ? { data: { display_name: displayName } } : undefined,
  });

  if (error) {
    console.error("signUp failed", { code: error.code, status: error.status });
    return fail({ error: signUpMessage(error) }, values);
  }
  if (!data.session) {
    return fail({ notice: "Almost there! Check your email to confirm your account, then sign in." }, values);
  }

  return fail({ redirectTo: safeNextPath(readField(formData, "next")) }, values);
}

export async function signIn(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const raw = { email: readField(formData, "email"), password: readField(formData, "password") };
  const values = { email: raw.email.trim(), displayName: "" };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return fail({ fieldErrors: toFieldErrors(parsed.error.issues) }, values);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    console.error("signIn failed", { code: error.code, status: error.status });
    return fail({ error: signInMessage(error) }, values);
  }

  return fail({ redirectTo: safeNextPath(readField(formData, "next")) }, values);
}
