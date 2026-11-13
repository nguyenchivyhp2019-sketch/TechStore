import "server-only";
import { supabaseAdmin } from "./supabase-admin";

// Giới hạn số lần gọi API theo IP.
// Đếm trong Supabase (hàm hit_rate_limit, xem supabase/rate_limits.sql) vì bộ nhớ
// RAM không dùng chung giữa các lần chạy serverless trên Vercel.
// Trả về true nếu IP này đã vượt quá `limit` lần trong `windowSeconds` giây gần nhất.
export async function hitRateLimit(request, { scope, limit, windowSeconds }) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const { data, error } = await supabaseAdmin.rpc("hit_rate_limit", {
    p_key: `${scope}:${ip}`,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error(
      error.code === "PGRST202"
        ? "Chưa tạo hàm hit_rate_limit trong Supabase (chạy supabase/rate_limits.sql). Tạm thời không giới hạn."
        : `Không kiểm tra được rate limit: ${error.message}`
    );
    return false;
  }
  return data === true;
}
