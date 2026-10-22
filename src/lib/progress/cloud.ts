import type { SupabaseClient } from "@supabase/supabase-js";
import type { Progress } from "./progress";
import { parseProgress } from "./schema";
import type { RemoteProgress } from "./store-core";

/** Row-level security restricts these calls to the signed-in learner's own row. */
export const createCloudRemote = (client: SupabaseClient, userId: string): RemoteProgress => ({
  async load(): Promise<Progress | null> {
    const { data, error } = await client
      .from("progress")
      .select("data")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data ? parseProgress(data.data) : null;
  },

  async save(progress: Progress): Promise<void> {
    const { error } = await client
      .from("progress")
      .upsert({ user_id: userId, data: progress, updated_at: new Date().toISOString() });
    if (error) throw error;
  },
});
