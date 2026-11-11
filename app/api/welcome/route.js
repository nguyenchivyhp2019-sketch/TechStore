import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request) {
  const webhookUrl = process.env.MAKE_WEBHOOK_URL?.trim();
  const webhookKey = process.env.MAKE_WEBHOOK_API_KEY?.trim();

  if (!webhookUrl || !webhookKey) {
    return NextResponse.json(
      { error: "Chưa cấu hình email chào mừng." },
      { status: 503 }
    );
  }

  const authorization = request.headers.get("authorization") || "";
  const token = authorization.match(/^Bearer\s+(\S+)$/i)?.[1];

  if (!token) {
    return NextResponse.json(
      { error: "Vui lòng đăng nhập." },
      { status: 401 }
    );
  }

  try {
    // Xác minh tài khoản trên máy chủ
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Phiên đăng nhập không hợp lệ." },
        { status: 401 }
      );
    }

    if (!user.email || !user.email_confirmed_at) {
      return NextResponse.json(
        { error: "Tài khoản chưa xác nhận email." },
        { status: 403 }
      );
    }

    // Khóa chính user_id ngăn hai yêu cầu cùng gửi một thư.
    const { error: claimError } = await supabaseAdmin
      .from("welcome_email_deliveries")
      .insert({
        user_id: user.id,
        status: "sending",
        updated_at: new Date().toISOString(),
      });

    if (claimError?.code === "23505") {
      return NextResponse.json({
        status: "skipped",
        message: "Tài khoản đã được ghi nhận gửi thư.",
      });
    }

    if (claimError) {
      console.error("Không ghi nhận được thư chào mừng:", claimError.code);

      return NextResponse.json(
        { error: "Không thể chuẩn bị email chào mừng." },
        { status: 500 }
      );
    }

    const fullName = user.user_metadata?.full_name;
    const name =
      typeof fullName === "string" && fullName.trim()
        ? fullName.trim().slice(0, 150)
        : "bạn";

    let deliveryStatus = "sending";

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-make-apikey": webhookKey,
        },
        body: JSON.stringify({
          event: "account_created",
          email: user.email,
          name,
          website_url: "https://tech-store-rho-vert.vercel.app/login",
        }),
        signal: AbortSignal.timeout(10000),
        redirect: "error",
      });

      deliveryStatus = response.ok ? "accepted" : "failed";

      if (!response.ok) {
        console.error("Make từ chối thư chào mừng:", response.status);
      }
    } catch {
      // Có thể Make đã nhận nhưng phản hồi bị mất.
      // Giữ trạng thái sending để tránh tự gửi trùng.
console.error("Chưa xác định được Make đã nhận thư chào mừng.");
    }

    const now = new Date().toISOString();

    const { error: updateError } = await supabaseAdmin
      .from("welcome_email_deliveries")
      .update({
        status: deliveryStatus,
        updated_at: now,
        accepted_at: deliveryStatus === "accepted" ? now : null,
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Không cập nhật được trạng thái thư:", updateError.code);
    }

    return NextResponse.json({
      status: deliveryStatus,
    });
  } catch {
    console.error("Lỗi xử lý email chào mừng.");

    return NextResponse.json(
      { error: "Chưa xử lý được email chào mừng." },
      { status: 500 }
    );
  }
}