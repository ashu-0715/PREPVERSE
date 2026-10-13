import { supabase } from "@/integrations/supabase/client";

export async function callExamAi<T = any>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("exam-ai", { body });
  if (error) {
    let msg = "Oops, something went wrong. Give it another try.";
    try {
      const ctx = await (error as any).context?.json?.();
      if (ctx?.error) msg = ctx.error;
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error);
  return data as T;
}

/** Simple spaced-repetition step: returns next interval in days. */
export function nextInterval(current: number, knewIt: boolean): number {
  if (!knewIt) return 0;
  if (current <= 0) return 1;
  return Math.min(60, Math.round(current * 2.5));
}
