import "server-only";
import { supabaseAdmin } from "./supabase-admin";

// Giới hạn số lần tra cứu theo IP để chống dò mã đơn.
// Đếm trong Supabase (hàm hit_rate_limit, xem supabase/rate_limits.sql) vì bộ nhớ
// RAM không dùng chung giữa các lần chạy serverless trên Vercel.
const LIMIT = 10;
const WINDOW_SECONDS = 60;

export async function rateLimited(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const { data, error } = await supabaseAdmin.rpc("hit_rate_limit", {
    p_key: `order-lookup:${ip}`,
    p_limit: LIMIT,
    p_window_seconds: WINDOW_SECONDS,
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

// Đưa số điện thoại về dạng 0xxxxxxxxx để so sánh
export const normalizePhone = (s) =>
  String(s ?? "").replace(/[\s.-]/g, "").replace(/^\+84/, "0");

// Tìm đơn theo mã + số điện thoại đặt hàng. Trả về null nếu không khớp.
export async function findOrder(code, phone) {
  const cleanCode = String(code ?? "").trim().toUpperCase();
  const cleanPhone = normalizePhone(phone);
  if (!/^DH[0-9A-F]{6,20}$/.test(cleanCode) || !/^0\d{9}$/.test(cleanPhone)) return null;

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("id, code, customer_name, phone, address, total, status, created_at, order_items(id, product_name, variant_label, qty, price)")
    .eq("code", cleanCode)
    .maybeSingle();

  if (error) throw error;
  if (!data || normalizePhone(data.phone) !== cleanPhone) return null;
  return data;
}
