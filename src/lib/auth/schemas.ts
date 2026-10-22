import { z } from "zod";

// Supabase hashes passwords with bcrypt, which only looks at the first 72 bytes.
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72;
const DISPLAY_NAME_MAX = 40;

const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address."));

export const signupSchema = z.object({
  email,
  password: z
    .string()
    .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters.`)
    .max(PASSWORD_MAX, `Use at most ${PASSWORD_MAX} characters.`),
  displayName: z
    .string()
    .trim()
    .max(DISPLAY_NAME_MAX, `Keep your name under ${DISPLAY_NAME_MAX} characters.`)
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(PASSWORD_MAX),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

const ORIGIN_PROBE = "http://groves.invalid";

/**
 * Where to send someone after signing in. Only same-site paths are allowed, so a crafted
 * `?next=` link can never bounce a learner to another website.
 */
export const safeNextPath = (raw: string | null | undefined, fallback = "/"): string => {
  if (!raw || !raw.startsWith("/")) return fallback;
  try {
    const url = new URL(raw, ORIGIN_PROBE);
    if (url.origin !== ORIGIN_PROBE) return fallback;
    if (url.pathname === "/login" || url.pathname.startsWith("/login/")) return fallback;
    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
};
