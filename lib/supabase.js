import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY // Hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY tùy tên biến của bạn
);