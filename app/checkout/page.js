"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "../CartContext";
import { supabase } from "@/lib/supabase";
import { Lock, ShieldAlert, Crosshair, ArrowLeft } from "lucide-react";

const money = (n) => n.toLocaleString("vi-VN") + " đ";
const CUT_CARD = "polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)";
const CUT_BUTTON = "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)";

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Kiểm tra trạng thái đăng nhập khi vào trang
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setCheckingAuth(false);
    };
    checkUser();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setLoading(true);
    setError("");

    try {
      // Lấy phiên đăng nhập mới nhất để máy chủ xác minh khách hàng
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      // Nếu không có session hoặc token hết hạn -> Yêu cầu đăng nhập lại
      if (sessionError || !session?.access_token) {
        throw new Error(
          "Phiên đăng nhập của bạn đã hết hạn hoặc không hợp lệ. Vui lòng tải lại trang và đăng nhập lại."
        );
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: f.get("name"),
          phone: f.get("phone"),
          address: f.get("address"),
          items: items.map(({ id, label, color, qty }) => ({
            id, label, color, qty,
          })),
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Đặt hàng thất bại");

      setOrder({
        code: data.code, 
        name: f.get("name"), 
        phone: f.get("phone"), 
        address: f.get("address"),
        total: data.total,
        items: data.items.map((l, idx) => ({ 
          key: idx, 
          name: l.product_name, 
          label: l.variant_label, 
          color: l.color, 
          price: l.price, 
          qty: l.qty 
        })),
      });
      clear(); // Xóa giỏ hàng sau khi đặt thành công
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Đang kiểm tra đăng nhập
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-red-500 font-doom text-2xl tracking-widest">
        ĐANG KẾT NỐI HỆ THỐNG...
      </div>
    );
  }

  // CHƯA ĐĂNG NHẬP -> Bắt buộc đăng nhập
  if (!user) {
    return (
      <main className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div 
          className="bg-[#111] p-10 shadow-[0_0_30px_rgba(220,38,38,0.2)] w-full max-w-md border border-[#333] text-center"
          style={{ clipPath: CUT_CARD }}
        >
          <div className="w-20 h-20 bg-red-950/30 border border-red-700 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(220,38,38,0.5)]">
            <Lock size={40} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">Yêu cầu đăng nhập</h2>
          <p className="text-gray-400 mb-8 font-sans">
            Bạn cần đăng nhập hoặc tạo tài khoản để có thể tiến hành đặt hàng và theo dõi đơn hàng của mình.
          </p>
          
          <Link href="/login?redirect=/checkout" className="block w-full bg-red-800 hover:bg-red-700 text-white font-bold py-3 transition-colors mb-3 border border-red-600">
            Đăng nhập ngay
          </Link>
          <Link href="/cart" className="block w-full bg-[#222] hover:bg-[#333] text-gray-300 font-medium py-3 transition-colors border border-[#444]">
            Quay lại giỏ hàng
          </Link>
        </div>
      </main>
    );
  }

  // MÀN HÌNH ĐẶT HÀNG THÀNH CÔNG
  if (order) {
    return (
      <main className="min-h-screen bg-[#050505] py-12 px-4">
        <div 
          className="max-w-2xl mx-auto bg-[#111] p-8 shadow-[0_0_30px_rgba(220,38,38,0.2)] border border-[#333] text-center"
          style={{ clipPath: CUT_CARD }}
        >
          <div className="w-20 h-20 bg-green-950/30 border border-green-700 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(34,197,94,0.5)]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-3xl font-black mb-2 text-white uppercase tracking-wide">Đặt hàng thành công!</h1>
          <p className="text-gray-400 mb-8 font-sans">
            Mã đơn hàng của bạn là: <span className="text-red-500 font-bold font-doom text-xl">#{order.code}</span>
          </p>
          
          <div className="bg-[#050505] border border-[#333] p-4 mb-6 text-left">
            <p className="font-bold text-gray-200 mb-2 uppercase tracking-wide">Thông tin giao hàng:</p>
            <p className="text-sm text-gray-400 font-sans">Người nhận: {order.name} - {order.phone}</p>
            <p className="text-sm text-gray-400 font-sans">Địa chỉ: {order.address}</p>
          </div>

          <ul className="border border-[#333] divide-y divide-[#333] mb-6 text-left bg-[#0a0a0a]">
            {order.items.map((i) => (
              <li key={i.key} className="p-4 flex justify-between items-center">
                <div>
                  <span className="font-bold text-gray-200">{i.name}</span>
                  <div className="text-sm text-gray-500 mt-1 font-sans">
                    {i.label && <span>{i.label} </span>}
                    {i.color && <span>- Màu: {i.color} </span>}
                    <span>× {i.qty}</span>
                  </div>
                </div>
                <span className="font-bold text-red-500">{money(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          
          <div className="flex justify-between items-center mb-8 px-4 border-t border-[#333] pt-4">
            <span className="text-lg text-gray-400 font-medium">Tổng thanh toán:</span>
            <span className="text-2xl font-black text-red-500 drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]">{money(order.total)}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/profile" className="bg-red-800 hover:bg-red-700 text-white font-bold px-8 py-3 transition-colors border border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)]">
              Xem đơn hàng của tôi
            </Link>
            <Link href="/products" className="bg-[#222] hover:bg-[#333] text-gray-300 font-bold px-8 py-3 transition-colors border border-[#444]">
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // GIỎ HÀNG TRỐNG
  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-4">
        <ShieldAlert size={64} className="text-red-500 mb-6 opacity-50" />
        <p className="text-gray-400 mb-6 text-xl font-bold uppercase tracking-wider">Kho vũ khí của bạn đang trống.</p>
        <Link href="/products" className="bg-red-800 hover:bg-red-700 text-white px-8 py-3 font-bold transition-colors border border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)]">
          Trang bị ngay
        </Link>
      </main>
    );
  }

  // FORM ĐIỀN THÔNG TIN ĐẶT HÀNG
  return (
    <main className="min-h-screen bg-[#050505] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/cart" className="text-sm text-gray-500 hover:text-red-500 mb-6 inline-flex items-center gap-2 font-bold uppercase tracking-wider transition-colors">
          <ArrowLeft size={16} /> Quay lại giỏ hàng
        </Link>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* CỘT TRÁI: FORM ĐIỀN THÔNG TIN */}
          <div 
            className="bg-[#111] p-6 shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-[#333]"
            style={{ clipPath: CUT_CARD }}
          >
            <h1 className="text-2xl font-black mb-6 text-white border-b border-[#333] pb-3 uppercase tracking-wide flex items-center gap-2">
              <Crosshair className="text-red-600" /> Thông tin đặt hàng
            </h1>
            <form onSubmit={handleSubmit} className="space-y-4 font-sans">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1 uppercase tracking-wide">Họ và tên</label>
                <input name="name" required placeholder="VD: Nguyễn Văn A" className="w-full border border-[#333] px-4 py-3 bg-[#050505] text-white focus:outline-none focus:border-red-600 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1 uppercase tracking-wide">Số điện thoại</label>
                <input name="phone" required placeholder="VD: 0987654321" className="w-full border border-[#333] px-4 py-3 bg-[#050505] text-white focus:outline-none focus:border-red-600 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1 uppercase tracking-wide">Địa chỉ nhận hàng</label>
                <input name="address" required placeholder="Số nhà, tên đường, quận/huyện..." className="w-full border border-[#333] px-4 py-3 bg-[#050505] text-white focus:outline-none focus:border-red-600 transition-colors" />
              </div>
              
              {error && <p className="text-red-500 text-sm font-bold bg-red-950/30 p-3 border border-red-900">{error}</p>}

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-red-800 hover:bg-red-700 text-white font-black text-lg px-6 py-4 transition-all mt-4 disabled:opacity-50 border border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                style={{ clipPath: CUT_BUTTON }}
              >
                {loading ? "ĐANG XỬ LÝ..." : "XÁC NHẬN ĐẶT HÀNG"}
              </button>
            </form>
          </div>

          {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG */}
          <div>
            <div 
              className="bg-[#111] p-6 shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-[#333] sticky top-24"
              style={{ clipPath: CUT_CARD }}
            >
              <h2 className="text-xl font-black mb-4 text-white border-b border-[#333] pb-3 uppercase tracking-wide">Đơn hàng của bạn</h2>
              <ul className="space-y-4 mb-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((i) => (
                  <li key={i.key} className="flex justify-between items-start gap-4 font-sans">
                    <div className="flex-1">
                      <p className="font-bold text-gray-200 text-sm line-clamp-1">{i.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {i.label && <span className="mr-2">{i.label}</span>}
                        {i.color && <span className="mr-2">- Màu: {i.color}</span>}
                        <span className="text-red-400">SL: {i.qty}</span>
                      </p>
                    </div>
                    <div className="font-bold text-gray-200 text-sm whitespace-nowrap">
                      {money(i.price * i.qty)}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="border-t border-[#333] pt-4 flex justify-between items-center">
                <span className="text-gray-400 font-bold uppercase tracking-wider">Tổng tiền:</span>
                <span className="text-2xl font-black text-red-500 drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]">{money(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}