"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, LogOut, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import { statusOf } from "@/lib/order-status";
import { CUT_BUTTON, card, pageTitle, btnPrimary } from "@/lib/ui";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login?redirect=/profile");
        return;
      }
      setUser(user);

      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) setError("Không tải được lịch sử đơn hàng.");
      setOrders(data || []);
      setLoading(false);
    };
    fetchData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-xs font-bold uppercase tracking-[0.3em] text-gray-500">
        Đang tải...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className={`${card} p-6 mb-10 flex flex-wrap items-center justify-between gap-4`}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 flex items-center justify-center border border-red-700 bg-red-950/30 text-red-500">
            <UserRound size={28} />
          </div>
          <div>
            <h1 className={pageTitle}>Tài khoản</h1>
            <p className="text-gray-500 text-sm">{user?.email}</p>
          </div>
        </div>
        <button type="button" onClick={handleLogout} className="flex items-center gap-2 border border-[#333] hover:border-red-700 text-gray-400 hover:text-red-500 px-4 py-2 font-bold text-sm uppercase tracking-wider transition-colors">
          <LogOut size={16} /> Đăng xuất
        </button>
      </div>

      <h2 className="text-xl font-black uppercase italic tracking-wide text-white mb-4 border-l-4 border-red-600 pl-3">
        Lịch sử đơn hàng <span className="text-gray-500 text-base not-italic">({orders.length})</span>
      </h2>

      {error && <p role="alert" className="border-l-2 border-red-600 bg-red-950/30 px-4 py-3 text-sm text-red-400 mb-4">{error}</p>}

      {orders.length === 0 ? (
        <div className={`${card} text-center p-12`}>
          <Package size={48} strokeWidth={1.2} className="mx-auto text-red-700 mb-4" />
          <p className="text-gray-400 mb-6">Bạn chưa có đơn hàng nào.</p>
          <Link href="/products" className={btnPrimary} style={{ clipPath: CUT_BUTTON }}>Mua sắm ngay</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusOf(order.status);
            return (
              <article key={order.id} className={`${card} p-5 md:p-6`}>
                <div className="flex flex-wrap justify-between items-start gap-3 border-b border-[#2a2a2a] pb-4 mb-4">
                  <div>
                    <p className="font-doom text-xl text-red-500 tracking-wider">{order.code}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-bold border ${status.badge}`}>{status.label}</span>
                </div>

                <ul className="space-y-2 mb-4">
                  {order.order_items?.map((item) => (
                    <li key={item.id} className="flex justify-between gap-4 text-sm text-gray-400">
                      <span>{item.product_name}{item.variant_label && ` (${item.variant_label})`} × {item.qty}</span>
                      <span className="font-semibold text-gray-300 whitespace-nowrap">{formatPrice(item.price * item.qty)}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex justify-between items-center border-t border-[#2a2a2a] pt-4">
                  <span className="text-sm text-gray-400">Giao tới: <span className="text-gray-300">{order.address}</span></span>
                  <span className="font-black text-red-500 text-lg whitespace-nowrap ml-4">{formatPrice(order.total)}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
