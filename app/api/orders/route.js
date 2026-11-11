import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

const money = (value) =>
  Number(value).toLocaleString("vi-VN") + " ₫";

const fail = (message, status) =>
  NextResponse.json({ error: message }, { status });

export async function POST(request) {
  // Kiểm tra cấu hình trước khi tạo đơn
  const webhookUrl = process.env.MAKE_WEBHOOK_URL?.trim();
  const webhookKey = process.env.MAKE_WEBHOOK_API_KEY?.trim();

  if (!webhookUrl || !webhookKey) {
    console.error("Thiếu cấu hình kết nối Make");
    return fail("Hệ thống đặt hàng chưa sẵn sàng.", 503);
  }

  // Xác minh phiên đăng nhập do checkout gửi lên
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.match(/^Bearer\s+(\S+)$/i)?.[1];

  if (!token) {
    return fail("Vui lòng đăng nhập để đặt hàng.", 401);
  }

  try {
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      // CẬP NHẬT 1: Thêm log chi tiết để dễ debug trên Vercel
      console.error("getUser failed:", authError?.status, authError?.message);
      return fail("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.", 401);
    }

    if (!user.email) {
      return fail("Tài khoản chưa có email nhận thông tin đơn hàng.", 400);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return fail("Dữ liệu không hợp lệ.", 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return fail("Dữ liệu không hợp lệ.", 400);
    }

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const phone =
      typeof body.phone === "string"
        ? body.phone.replace(/\s/g, "")
        : "";

    const address =
      typeof body.address === "string" ? body.address.trim() : "";

    const items = Array.isArray(body.items) ? body.items : [];

    if (!name || name.length > 150 || !address || address.length > 1000) {
      return fail("Vui lòng kiểm tra họ tên và địa chỉ nhận hàng.", 400);
    }

    if (!/^(0\d{9}|\+84\d{9})$/.test(phone)) {
      return fail("Số điện thoại không hợp lệ.", 400);
    }

    if (
      items.length === 0 ||
      items.length > 50 ||
      items.some(
        (item) =>
          !item ||
          !["string", "number"].includes(typeof item.id) ||
          !String(item.id).trim() ||
          !Number.isInteger(Number(item.qty)) ||
          Number(item.qty) < 1 ||
          Number(item.qty) > 100
      )
    ) {
      return fail("Giỏ hàng không hợp lệ.", 400);
    }

    // Luôn lấy giá từ database
    const ids = [...new Set(items.map((item) => String(item.id)))];

    const { data: products, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, name, price, variants")
      .in("id", ids);

    if (productError) {
      console.error("Không đọc được sản phẩm:", productError.code, productError.message);
      return fail("Không thể kiểm tra sản phẩm lúc này.", 500);
    }

    const byId = new Map(
      (products || []).map((product) => [String(product.id), product])
    );

    const lines = [];

    for (const item of items) {
      const product = byId.get(String(item.id));

      if (!product) {
        return fail("Có sản phẩm không còn tồn tại.", 400);
      }

      let rawPrice = product.price;
      let label = null;

      if (Array.isArray(product.variants) && product.variants.length > 0) {
        const variant = product.variants.find(
          (entry) => entry.label === item.label
        );

        if (!variant) {
          return fail(`Vui lòng chọn phiên bản cho ${product.name}.`, 400);
        }

        rawPrice = variant.price;
        label = variant.label;
      }

      const price = Number(rawPrice);

      if (
        rawPrice == null ||
        rawPrice === "" ||
        !Number.isSafeInteger(price) ||
        price <= 0
      ) {
        return fail(`${product.name} chưa có giá hợp lệ.`, 400);
      }

      // CẬP NHẬT 2: Thêm color vào mảng lines
      lines.push({
        product_id: product.id,
        product_name: product.name,
        variant_label: label,
        price,
        qty: Number(item.qty),
        color: typeof item.color === "string" ? item.color.slice(0, 50) : null,
      });
    }

    const total = lines.reduce(
      (sum, line) => sum + line.price * line.qty,
      0
    );

    if (!Number.isSafeInteger(total)) {
      return fail("Tổng tiền không hợp lệ.", 400);
    }

    const code =
      "DH" + randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase();

    // ID khách hàng lấy từ tài khoản đã xác minh
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        code,
        customer_name: name,
        phone,
        address,
        total,
        status: "pending",
        user_id: user.id,
      })
      .select("id, code")
      .single();

    if (orderError) {
      console.error("Không lưu được đơn:", orderError.code, orderError.message);
      return fail("Không lưu được đơn hàng.", 500);
    }

    // CẬP NHẬT 3: Tách color ra khỏi line khi insert vào database 
    // (để tránh lỗi nếu bảng order_items chưa có cột color)
    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(
        lines.map(({ color, ...line }) => ({
          ...line,
          order_id: order.id,
        }))
      );

    if (itemsError) {
      console.error("Không lưu được chi tiết đơn:", itemsError.code, itemsError.message);

      const { error: rollbackError } = await supabaseAdmin
        .from("orders")
        .delete()
        .eq("id", order.id);

      if (rollbackError) {
        console.error("Cần kiểm tra đơn lưu dở:", order.code);
      }

      return fail("Không lưu được chi tiết đơn hàng.", 500);
    }

    const createdAt = new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date());

    // Giữ tên trường tương ứng với các biến đang dùng trong Make
    const payload = {
      event: "order_created",
      email: user.email,
      name,
      order_id: order.code,
      product_info: lines
        .map((line) => {
          const variant = line.variant_label
            ? ` (${line.variant_label})`
            : "";

          return `${line.product_name}${variant} × ${line.qty}`;
        })
        .join("; "),
      quantity: String(
        lines.reduce((sum, line) => sum + line.qty, 0)
      ),
      product_amount: money(total),
      created_at: createdAt,
      shipping_address: address,
      subtotal: money(total),
      shipping_fee: "Miễn phí",
      total: money(total),
      website_url: "https://tech-store-rho-vert.vercel.app",
      customer_phone: phone,
    };

    // Đơn đã lưu: lỗi gửi Make không làm mất đơn hàng
    let makeStatus = "failed";

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-make-apikey": webhookKey,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
        redirect: "error",
      });

      if (response.ok) {
        makeStatus = "accepted";
      } else {
        console.error(
          "Make từ chối thông báo đơn:",
          order.code,
          response.status
        );
      }
    } catch {
      console.error("Chưa xác nhận được Make nhận đơn:", order.code);
    }

    return NextResponse.json({
      code: order.code,
      total,
      items: lines, // Trả về lines có chứa color để trang Checkout hiển thị
      make_status: makeStatus,
    });
  } catch (err) {
    console.error("Lỗi ngoài dự kiến khi xử lý đơn hàng:", err?.message);
    return fail(
      "Có lỗi xử lý. Vui lòng kiểm tra đơn trong tài khoản trước khi thử lại.",
      500
    );
  }
}