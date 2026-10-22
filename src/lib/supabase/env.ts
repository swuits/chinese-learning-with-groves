/** Public values only: the URL and the publishable key are safe to ship to the browser. */
export const getSupabaseEnv = (): { url: string; publishableKey: string } => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Add them to .env.local.",
    );
  }
  return { url, publishableKey };
};
