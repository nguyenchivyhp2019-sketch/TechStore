import { NextResponse } from "next/server";
import { findOrder, rateLimited } from "@/lib/order-lookup";

const fail = (error, status) => NextResponse.json({ error }, { status });

// Tra cứu đơn hàng bằng mã đơn + số điện thoại đặt hàng
export async function POST(request) {
  if (rateLimited(request)) return fail("Bạn thao tác quá nhanh. Vui lòng thử lại sau 1 phút.", 429);

  let body;
  try {
    body = await request.json();
  } catch {
    return fail("Dữ liệu không hợp lệ.", 400);
  }

  try {
    const order = await findOrder(body?.code, body?.phone);
    if (!order) return fail("Không tìm thấy đơn hàng. Kiểm tra lại mã đơn và số điện thoại.", 404);

    const { id, phone, ...publicOrder } = order;
    return NextResponse.json({
      ...publicOrder,
      phone: phone.replace(/^(.*)(\d{3})$/, (_, a, b) => "*".repeat(a.length) + b),
    });
  } catch (err) {
    console.error("Lỗi tra cứu đơn:", err?.message);
    return fail("Không thể tra cứu lúc này. Vui lòng thử lại sau.", 500);
  }
}
