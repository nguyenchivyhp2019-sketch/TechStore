import "server-only";
import { supabaseAdmin } from "./supabase-admin";

// Giới hạn số lần tra cứu theo IP để chống dò mã đơn (bộ nhớ RAM, đủ cho đồ án)
const hits = new Map();
const LIMIT = 10;
const WINDOW_MS = 60_000;

export function rateLimited(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > LIMIT;
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
