"use client";
import { useState } from "react";
import { Search, XCircle } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { ORDER_STEPS, statusOf } from "@/lib/order-status";
import { SITE } from "@/lib/site";
import { CUT_CARD, card, pageTitle, label, input, btnPrimary } from "@/lib/ui";

async function post(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra. Vui lòng thử lại.");
  return data;
}

export default function TrackOrderPage() {
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    setOrder(null);
    setConfirmCancel(false);
    try {
      setOrder(await post("/api/orders/track", { code, phone }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await post("/api/orders/cancel", { code: order.code, phone });
      setNotice(data.message);
      setOrder({ ...order, status: "cancelled" });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setConfirmCancel(false);
    }
  };

  const stepIndex = order ? ORDER_STEPS.indexOf(order.status) : -1;
  const status = order && statusOf(order.status);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className={`${pageTitle} mb-2`}>Tra cứu <span className="text-red-600">đơn hàng</span></h1>
        <p className="text-gray-500">Nhập mã đơn hàng và số điện thoại bạn đã dùng khi đặt hàng.</p>
      </div>

      <form onSubmit={handleTrack} className={`${card} p-5 mb-8 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end`}>
        <div>
          <label htmlFor="code" className={label}>Mã đơn hàng</label>
          <input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="DH..." required className={`${input} uppercase`} />
        </div>
        <div>
          <label htmlFor="phone" className={label}>Số điện thoại</label>
          <input id="phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xxxxxxxx" required autoComplete="tel" className={input} />
        </div>
        <button type="submit" disabled={loading} className={`${btnPrimary} h-[50px]`}>
          <Search size={18} /> {loading && !order ? "Đang tìm..." : "Tra cứu"}
        </button>
      </form>

      {error && <p role="alert" className="border-l-2 border-red-600 bg-red-950/30 px-4 py-3 text-sm text-red-400 mb-6">{error}</p>}
      {notice && <p role="status" className="border-l-2 border-green-500 bg-green-950/30 px-4 py-3 text-sm text-green-400 mb-6">{notice}</p>}

      {order && (
        <div className="bg-[#111] border border-[#333] p-6 md:p-8" style={{ clipPath: CUT_CARD }}>
          <div className="flex flex-wrap justify-between gap-4 pb-5 mb-6 border-b border-[#333]">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-500">Mã đơn hàng</p>
              <p className="font-doom text-2xl text-red-500 tracking-wider">{order.code}</p>
              <p className="text-sm text-gray-400 mt-2">Người nhận: <span className="text-gray-200">{order.customer_name}</span> · {order.phone}</p>
              <p className="text-sm text-gray-400">Địa chỉ: <span className="text-gray-200">{order.address}</span></p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest text-gray-500">Ngày đặt</p>
              <p className="text-gray-200">{new Date(order.created_at).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}</p>
              <span className={`inline-block mt-2 px-2.5 py-1 text-xs font-bold border ${status.badge}`}>{status.label}</span>
            </div>
          </div>

          {order.status === "cancelled" ? (
            <div className="flex items-center gap-3 border border-red-900 bg-red-950/30 text-red-400 p-4 mb-6">
              <XCircle size={22} /> <p className="font-medium">Đơn hàng này đã bị hủy.</p>
            </div>
          ) : (
            <ol className="grid grid-cols-4 gap-2 mb-8">
              {ORDER_STEPS.map((key, i) => {
                const { label: stepLabel, icon: Icon } = statusOf(key);
                const done = i <= stepIndex;
                return (
                  <li key={key} className="flex flex-col items-center text-center gap-2">
                    <div className={`w-11 h-11 flex items-center justify-center border-2 transition-colors ${done ? "border-red-600 bg-red-700 text-white shadow-[0_0_12px_rgba(220,38,38,0.6)]" : "border-[#333] text-gray-600"}`}>
                      <Icon size={20} />
                    </div>
                    <span className={`text-[11px] sm:text-xs font-bold ${done ? "text-gray-200" : "text-gray-600"}`}>{stepLabel}</span>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="bg-black/40 border border-[#2a2a2a] p-4 mb-6">
            <h2 className="font-bold uppercase tracking-wider text-gray-300 text-sm mb-3">Sản phẩm</h2>
            <ul className="space-y-2">
              {order.order_items?.map((item) => (
                <li key={item.id} className="flex justify-between gap-4 text-sm text-gray-300">
                  <span>{item.product_name}{item.variant_label && ` (${item.variant_label})`} × {item.qty}</span>
                  <span className="font-semibold whitespace-nowrap">{formatPrice(item.price * item.qty)}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-[#333] mt-3 pt-3 flex justify-between font-bold">
              <span className="text-gray-200">Tổng cộng</span>
              <span className="text-red-500 text-lg">{formatPrice(order.total)}</span>
            </div>
          </div>

          {order.status === "pending" &&
            (confirmCancel ? (
              <div className="border border-red-800 bg-red-950/20 p-4">
                <p className="text-sm text-gray-300 mb-3">Bạn chắc chắn muốn hủy đơn hàng này?</p>
                <div className="flex gap-3">
                  <button type="button" onClick={handleCancel} disabled={loading} className="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold py-2.5 disabled:opacity-50">
                    {loading ? "Đang hủy..." : "Xác nhận hủy"}
                  </button>
                  <button type="button" onClick={() => setConfirmCancel(false)} className="flex-1 border border-[#444] text-gray-300 hover:text-white font-bold py-2.5">
                    Giữ đơn
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmCancel(true)} className="w-full border border-red-900 text-red-400 hover:bg-red-950/40 font-bold uppercase tracking-wider py-3 transition-colors">
                Hủy đơn hàng
              </button>
            ))}

          <p className="text-xs text-gray-500 text-center mt-6">
            Cần hỗ trợ? Gọi <span className="text-red-500 font-bold">{SITE.hotline}</span> ({SITE.hours})
          </p>
        </div>
      )}
    </div>
  );
}
