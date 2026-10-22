export type AuthField = "email" | "password" | "displayName";

export interface AuthFormState {
  error: string | null;
  notice: string | null;
  /** Set once sign-in worked. The browser then does a full page load so its Supabase client starts with the new session. */
  redirectTo: string | null;
  fieldErrors: Partial<Record<AuthField, string>>;
  /** Echoed back so a failed submit does not wipe what the person typed. */
  values: { email: string; displayName: string };
}

export const INITIAL_AUTH_STATE: AuthFormState = {
  error: null,
  notice: null,
  redirectTo: null,
  fieldErrors: {},
  values: { email: "", displayName: "" },
};
