import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { findOrder, rateLimited } from "@/lib/order-lookup";

const fail = (error, status) => NextResponse.json({ error }, { status });

// Khách tự hủy đơn: cần đúng mã đơn + số điện thoại, và đơn còn ở trạng thái chờ xử lý
export async function POST(request) {
  if (await rateLimited(request)) return fail("Bạn thao tác quá nhanh. Vui lòng thử lại sau 1 phút.", 429);

  let body;
  try {
    body = await request.json();
  } catch {
    return fail("Dữ liệu không hợp lệ.", 400);
  }

  try {
    const order = await findOrder(body?.code, body?.phone);
    if (!order) return fail("Không tìm thấy đơn hàng.", 404);

    if (order.status !== "pending") {
      return fail("Đơn hàng đã được xử lý nên không thể hủy. Vui lòng liên hệ hotline.", 409);
    }

    // Điều kiện status = pending đặt ngay trong câu lệnh để tránh hủy đơn vừa được duyệt
    const { data, error } = await supabaseAdmin
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", order.id)
      .eq("status", "pending")
      .select("id");

    if (error) throw error;
    if (!data?.length) return fail("Đơn hàng vừa được xử lý nên không thể hủy.", 409);

    return NextResponse.json({ message: "Đã hủy đơn hàng thành công." });
  } catch (err) {
    console.error("Lỗi hủy đơn:", err?.message);
    return fail("Không thể hủy đơn lúc này. Vui lòng thử lại sau.", 500);
  }
}
