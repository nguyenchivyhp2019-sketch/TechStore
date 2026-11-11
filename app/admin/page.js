import Link from "next/link";
import { revalidatePath } from "next/cache";
import { ShoppingBag, Clock, Banknote, Search, ArrowLeft } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUS, statusOf } from "@/lib/order-status";
import { card, pageTitle, input } from "@/lib/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Quản lý đơn hàng", robots: { index: false, follow: false } };

const VALID_STATUS = Object.keys(ORDER_STATUS);

async function updateStatus(formData) {
  "use server";
  const id = Number(formData.get("id"));
  const status = String(formData.get("status"));
  if (!Number.isInteger(id) || !VALID_STATUS.includes(status)) return;
  const { error } = await supabaseAdmin.from("orders").update({ status }).eq("id", id);
  if (error) console.error("Admin: không cập nhật được trạng thái", id, error.message);
  revalidatePath("/admin");
}

function StatCard({ icon: Icon, label, value, accent = "text-red-500" }) {
  return (
    <div className={`${card} p-5 flex items-center gap-4`}>
      <div className={`w-12 h-12 flex items-center justify-center border border-red-900 bg-red-950/30 ${accent}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-xs uppercase tracking-widest text-gray-500">{label}</p>
        <p className="text-2xl font-black text-white">{value}</p>
      </div>
    </div>
  );
}

export default async function AdminPage({ searchParams }) {
  const { status: statusFilter = "", q = "" } = await searchParams;

  const { data: allOrders, error } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="p-10 text-center text-red-500 font-bold">Không tải được danh sách đơn hàng.</div>;
  }

  const orders = allOrders ?? [];
  const revenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0);
  const pendingCount = orders.filter((o) => o.status === "pending").length;

  const needle = q.trim().toLowerCase();
  const shown = orders.filter(
    (o) =>
      (!statusFilter || o.status === statusFilter) &&
      (!needle ||
        o.code.toLowerCase().includes(needle) ||
        o.phone.includes(needle) ||
        o.customer_name.toLowerCase().includes(needle))
  );

  const filterHref = (s) => `/admin?${new URLSearchParams({ ...(s && { status: s }), ...(q && { q }) })}`;
  const chip = (active) =>
    `px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors ${
      active ? "bg-red-700 border-red-600 text-white" : "bg-[#111] border-[#333] text-gray-400 hover:border-red-700 hover:text-red-400"
    }`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className={pageTitle}>Quản lý <span className="text-red-600">đơn hàng</span></h1>
          <p className="text-gray-500 text-sm mt-1">Theo dõi và cập nhật trạng thái đơn đặt hàng</p>
        </div>
        <Link href="/" className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-400 hover:text-red-500 transition-colors">
          <ArrowLeft size={16} /> Về trang chủ
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={ShoppingBag} label="Tổng đơn hàng" value={orders.length} />
        <StatCard icon={Clock} label="Chờ xử lý" value={pendingCount} accent="text-yellow-400" />
        <StatCard icon={Banknote} label="Doanh thu (trừ đơn hủy)" value={formatPrice(revenue)} accent="text-green-400" />
      </div>

      <div className={`${card} p-4 mb-6 flex flex-col lg:flex-row lg:items-center gap-4`}>
        <div className="flex flex-wrap gap-2">
          <Link href={filterHref("")} className={chip(!statusFilter)}>Tất cả ({orders.length})</Link>
          {VALID_STATUS.map((s) => (
            <Link key={s} href={filterHref(s)} className={chip(statusFilter === s)}>
              {ORDER_STATUS[s].label} ({orders.filter((o) => o.status === s).length})
            </Link>
          ))}
        </div>
        <form className="flex gap-2 lg:ml-auto lg:w-80">
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          <input name="q" defaultValue={q} placeholder="Mã đơn, SĐT, tên khách..." aria-label="Tìm đơn hàng" className={`${input} py-2`} />
          <button type="submit" aria-label="Tìm" className="px-3 border border-red-700 bg-red-950/40 text-red-400 hover:bg-red-700 hover:text-white transition-colors">
            <Search size={18} />
          </button>
        </form>
      </div>

      <div className={`${card} overflow-x-auto`}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-black/50 border-b border-[#2a2a2a] text-xs uppercase tracking-wider text-gray-500">
              <th className="p-4 whitespace-nowrap">Mã đơn / Ngày</th>
              <th className="p-4 whitespace-nowrap">Khách hàng</th>
              <th className="p-4 min-w-[240px]">Sản phẩm</th>
              <th className="p-4 whitespace-nowrap">Tổng tiền</th>
              <th className="p-4 whitespace-nowrap">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a2a2a]">
            {shown.length === 0 && (
              <tr><td colSpan={5} className="p-10 text-center text-gray-500">Không có đơn hàng nào phù hợp.</td></tr>
            )}
            {shown.map((order) => {
              const st = statusOf(order.status);
              return (
                <tr key={order.id} className="hover:bg-red-950/10 transition-colors align-top">
                  <td className="p-4 whitespace-nowrap">
                    <p className="font-doom text-lg text-red-500 tracking-wider">{order.code}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-gray-100">{order.customer_name}</p>
                    <p className="text-gray-400">{order.phone}</p>
                    <p className="text-xs text-gray-500 max-w-[220px]">{order.address}</p>
                  </td>
                  <td className="p-4 text-gray-300">
                    <ul className="space-y-1">
                      {order.order_items?.map((item) => (
                        <li key={item.id} className="flex justify-between gap-3">
                          <span>{item.product_name}{item.variant_label && ` (${item.variant_label})`}</span>
                          <span className="text-gray-500 whitespace-nowrap">× {item.qty}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="p-4 font-black text-red-500 whitespace-nowrap">{formatPrice(order.total)}</td>
                  <td className="p-4">
                    <form action={updateStatus} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={order.id} />
                      <select
                        name="status"
                        defaultValue={order.status}
                        aria-label={`Trạng thái đơn ${order.code}`}
                        className={`px-2.5 py-1.5 text-xs font-bold border bg-[#0a0a0a] cursor-pointer outline-none focus:border-red-600 ${st.badge}`}
                      >
                        {VALID_STATUS.map((s) => (
                          <option key={s} value={s} className="bg-[#111] text-gray-200">{ORDER_STATUS[s].label}</option>
                        ))}
                      </select>
                      <button type="submit" className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-red-800 hover:bg-red-700 border border-red-600 text-white transition-colors">
                        Lưu
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
